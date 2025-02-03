const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from the 'public' folder
app.use(express.static('public'));

// Store all connected peers
let peers = [];

// Handle socket connections
io.on('connection', socket => {
    console.log(`A user connected: ${socket.id}`);

    // Add the new peer to the list and notify others
    socket.on('join-room', () => {
        peers.push(socket.id);
        io.emit('new-peer', socket.id);  // Notify all peers
    });

    // Handle peer leaving the room
    socket.on('leave-room', () => {
        peers = peers.filter(peer => peer !== socket.id);
        io.emit('peer-left', socket.id);  // Notify all peers
    });

    // Handle WebRTC offer event
    socket.on('offer', (offer, toPeer) => {
        io.to(toPeer).emit('offer', offer, socket.id); // Send offer to the intended peer
    });

    // Handle WebRTC answer event
    socket.on('answer', (answer, toPeer) => {
        io.to(toPeer).emit('answer', answer, socket.id); // Send answer to the offerer
    });

    // Handle ICE candidate event
    socket.on('ice-candidate', (candidate, toPeer) => {
        io.to(toPeer).emit('ice-candidate', candidate, socket.id); // Forward ICE candidate to the intended peer
    });

    // Handle disconnect event
    socket.on('disconnect', () => {
        peers = peers.filter(peer => peer !== socket.id);
        io.emit('peer-left', socket.id);  // Notify all peers
        console.log(`User disconnected: ${socket.id}`);
    });
});

// Start the server
server.listen(3000, () => {
    console.log('Server running on port 3000');
});
