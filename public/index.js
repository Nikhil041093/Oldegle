const socket = io();
let localStream;
let peerConnection;
const remoteVideosContainer = document.getElementById('remote-videos');
const myVideo = document.getElementById('my-video');
const remoteVideo = document.createElement('video');
const shareScreenButton = document.getElementById('share-screen');
const moveButton = document.getElementById('move-video');
const resizeButton = document.getElementById('resize-video');
const fullscreenButton = document.getElementById('fullscreen-video');
const darkModeButton = document.getElementById('dark-mode');
const muteVideoButton = document.getElementById('mute-video');
const muteAudioButton = document.getElementById('mute-audio');
const startCallButton = document.getElementById('start-call');
const leaveCallButton = document.getElementById('leave-call');
const chatBox = document.getElementById('chat-box');
const chatInput = document.getElementById('chat-input');
const sendChatButton = document.getElementById('send-chat');

let isResized = false;
let isMoving = false;

startCallButton.addEventListener('click', startCall);
leaveCallButton.addEventListener('click', leaveCall);
sendChatButton.addEventListener('click', sendMessage);
darkModeButton.addEventListener('click', toggleDarkMode);
shareScreenButton.addEventListener('click', shareScreen);
moveButton.addEventListener('click', moveVideo);
resizeButton.addEventListener('click', resizeVideo);
fullscreenButton.addEventListener('click', toggleFullscreen);
muteVideoButton.addEventListener('click', toggleVideoMute);
muteAudioButton.addEventListener('click', toggleAudioMute);

socket.on('call-incoming', () => {
    showPopupNotification('Incoming call!');
});

socket.on('receive-message', (message) => {
    const timestamp = new Date().toLocaleTimeString();
    displayMessage(`Stranger: ${message} <span class="timestamp">${timestamp}</span>`);
});

socket.on('new-peer', (peerId) => {
    const remoteVideo = document.createElement('video');
    remoteVideo.id = peerId;
    remoteVideo.autoplay = true;
    remoteVideosContainer.appendChild(remoteVideo);
});

socket.on('update-profile', (profile) => {
    document.getElementById('profile').style.display = 'none';
    const profileElement = document.createElement('div');
    profileElement.innerHTML = `<p>${profile.username}</p><img src="${profile.profilePic}" alt="Profile Pic" width="50" />`;
    document.getElementById('chat-container').prepend(profileElement);
});

function showPopupNotification(message) {
    const popup = document.createElement('div');
    popup.classList.add('popup-notification');
    popup.innerHTML = `<p>${message}</p>`;
    document.body.appendChild(popup);
    setTimeout(() => {
        popup.remove();
    }, 3000);
}

function displayMessage(message) {
    const msgElement = document.createElement('p');
    msgElement.innerHTML = message;
    chatBox.appendChild(msgElement);
}

function startCall() {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
            localStream = stream;
            myVideo.srcObject = stream;
            socket.emit('join-room');
        })
        .catch(error => {
            console.error('Error starting call:', error);
        });
}

function leaveCall() {
    if (peerConnection) {
        peerConnection.close();
    }
    localStream.getTracks().forEach(track => track.stop());
    socket.emit('leave-room');
}

function sendMessage() {
    const message = chatInput.value;
    if (message.trim()) {
        socket.emit('send-message', message);
        chatInput.value = '';
    }
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    document.getElementById('chat-container').classList.toggle('dark-mode');
}

function shareScreen() {
    navigator.mediaDevices.getDisplayMedia({ video: true })
        .then(screenStream => {
            const videoTrack = screenStream.getVideoTracks()[0];
            const sender = peerConnection.getSenders().find(sender => sender.track.kind === videoTrack.kind);
            sender.replaceTrack(videoTrack);
            remoteVideo.srcObject = screenStream;
        })
        .catch(err => {
            console.log('Error sharing screen:', err);
        });
}

function moveVideo() {
    isMoving = !isMoving;
    moveButton.textContent = isMoving ? 'Stop Moving' : 'Move';
    if (isMoving) {
        document.getElementById('video-player').style.position = 'absolute';
    } else {
        document.getElementById('video-player').style.position = 'fixed';
    }
}

function resizeVideo() {
    isResized = !isResized;
    resizeButton.textContent = isResized ? 'Resize Back' : 'Resize';
    if (isResized) {
        document.getElementById('video-player').style.width = '640px';
        document.getElementById('video-player').style.height = '480px';
    } else {
        document.getElementById('video-player').style.width = '320px';
        document.getElementById('video-player').style.height = '240px';
    }
}

function toggleFullscreen() {
    const elem = document.documentElement;
    if (document.fullscreenElement) {
        document.exitFullscreen();
    } else {
        elem.requestFullscreen();
    }
}

function toggleVideoMute() {
    const videoTrack = localStream.getVideoTracks()[0];
    videoTrack.enabled = !videoTrack.enabled;
    muteVideoButton.textContent = videoTrack.enabled ? 'Mute Video' : 'Unmute Video';
}

function toggleAudioMute() {
    const audioTrack = localStream.getAudioTracks()[0];
    audioTrack.enabled = !audioTrack.enabled;
    muteAudioButton.textContent = audioTrack.enabled ? 'Mute Audio' : 'Unmute Audio';
}
