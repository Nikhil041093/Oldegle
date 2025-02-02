const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

// Sample donation data (This can be replaced with a database)
const donations = [
    { name: 'John Doe', message: 'Thank you for your support to needful people!' },
    { name: 'Jane Smith', message: 'Supporting the cause of elderly care.' },
    { name: 'Mike Johnson', message: 'Happy to help orphaned kids and elderly.' },
    { name: 'Sarah Lee', message: 'Hope this helps those in need!' },
];

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// API route to serve donation history
app.get('/api/donations', (req, res) => {
    res.json(donations); // Send latest donation data
});

// WebSocket server to handle video calls and messaging
wss.on('connection', (ws) => {
    console.log('New client connected');

    ws.on('message', (message) => {
        console.log(`Received: ${message}`);
        const parsedMessage = JSON.parse(message);

        if (parsedMessage.type === 'offer') {
            // Broadcast the offer to another connected user
            wss.clients.forEach((client) => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(parsedMessage));
                }
            });
        } else if (parsedMessage.type === 'answer') {
            // Broadcast the answer to the person who initiated the call
            wss.clients.forEach((client) => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(parsedMessage));
                }
            });
        } else if (parsedMessage.type === 'candidate') {
            // Broadcast ICE candidates to other users
            wss.clients.forEach((client) => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(parsedMessage));
                }
            });
        } else if (parsedMessage.type === 'message') {
            // Broadcast chat message to all other clients
            wss.clients.forEach((client) => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(parsedMessage));
                }
            });
        } else if (parsedMessage.type === 'end-chat') {
            // Notify other users that the chat has ended
            wss.clients.forEach((client) => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'end-chat' }));
                }
            });
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// Set up the server to listen on a port
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
