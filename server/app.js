const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

let peers = [];

io.on('connection', socket => {
    socket.on('join-room', () => {
        peers.push(socket.id);
        io.emit('new-peer', socket.id);
    });

    socket.on('leave-room', () => {
        peers = peers.filter(peer => peer !== socket.id);
        io.emit('peer-left', socket.id);
    });

    socket.on('send-message', (message) => {
        io.emit('receive-message', message);
    });

    socket.on('disconnect', () => {
        peers = peers.filter(peer => peer !== socket.id);
        io.emit('peer-left', socket.id);
    });
});

server.listen(3000, () => {
    console.log('Server running on port 3000');
});
