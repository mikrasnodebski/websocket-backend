const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// Tworzenie serwera HTTP i WebSocket
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://grows-ultra-awesome-site-83e3d5.webflow.io", // Adres frontendu Webflow
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());

// Testowa strona główna (opcjonalna)
app.get('/', (req, res) => {
  res.send('WebSocket Server is running!');
});

// Obsługa połączeń WebSocket
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Odbieranie rysunków od klienta
  socket.on('draw', (data) => {
    // Wysyłanie danych do innych użytkowników
    socket.broadcast.emit('draw', data);
  });

  // Rozłączenie użytkownika
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Uruchomienie serwera
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
