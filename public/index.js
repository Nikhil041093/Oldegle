const socket = io();
let localStream;
let peerConnection;
const remoteVideosContainer = document.getElementById('remote-videos');
const myVideo = document.getElementById('my-video');
const chatBox = document.getElementById('chat-box');
const chatInput = document.getElementById('chat-input');
const sendChatButton = document.getElementById('send-chat');
const startCallButton = document.getElementById('start-call');
const leaveCallButton = document.getElementById('leave-call');
const muteVideoButton = document.getElementById('mute-video');
const muteAudioButton = document.getElementById('mute-audio');
const shareScreenButton = document.getElementById('share-screen');

socket.on('call-incoming', () => {
    alert('Incoming call!');
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

sendChatButton.addEventListener('click', sendMessage);
startCallButton.addEventListener('click', startCall);
leaveCallButton.addEventListener('click', leaveCall);
muteVideoButton.addEventListener('click', toggleVideoMute);
muteAudioButton.addEventListener('click', toggleAudioMute);
shareScreenButton.addEventListener('click', shareScreen);
