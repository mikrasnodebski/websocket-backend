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

// Stan aplikacji: lista rysunków
let drawingData = []; // Lista obiektów rysunków (wszystkie akcje na tablicy)

// Testowa strona główna (opcjonalna)
app.get('/', (req, res) => {
  res.send('WebSocket Server is running!');
});

// Obsługa połączeń WebSocket
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Połączenie nowego klienta — przesyłamy mu aktualny stan rysowania
  socket.emit('initialize', drawingData);

  // Odbieranie rysunków od klienta
  socket.on('draw', (data) => {
    drawingData.push(data); // Dodajemy nowy element do stanu
    socket.broadcast.emit('draw', data); // Wysyłamy dane do pozostałych klientów
  });

  // Odbieranie zdarzenia "clear"
  socket.on('clear', () => {
    drawingData = []; // Czyścimy wszystkie dane
    socket.broadcast.emit('clear'); // Rozsyłamy zdarzenie "clear"
  });

  // Odbieranie zdarzenia "undo"
  socket.on('undo', () => {
    if (drawingData.length > 0) {
      const removedObject = drawingData.pop(); // Usuwamy ostatni element
      socket.broadcast.emit('undo', removedObject); // Informujemy pozostałych o cofnięciu
    }
  });

  // Odbieranie zdarzenia "redo"
  socket.on('redo', (data) => {
    drawingData.push(data); // Przywracamy element do stanu
    socket.broadcast.emit('redo', data); // Informujemy pozostałych o przywróceniu
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
