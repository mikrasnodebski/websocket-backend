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

// Stan aplikacji: lista rysunków i stosy dla undo/redo
let drawingData = []; // Lista obiektów rysunków (wszystkie akcje na tablicy)
let undoStack = []; // Stos obiektów dla cofania
let redoStack = []; // Stos obiektów dla przywracania

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
    undoStack.push(data); // Dodajemy do stosu cofania
    redoStack = []; // Czyścimy stos przywracania
    console.log(`Draw received: ${JSON.stringify(data)}`);
    socket.broadcast.emit('draw', data); // Wysyłamy dane do pozostałych klientów
  });

  // Odbieranie zdarzenia "clear"
  socket.on('clear', () => {
    drawingData = []; // Czyścimy wszystkie dane
    undoStack = []; // Czyścimy stos cofania
    redoStack = []; // Czyścimy stos przywracania
    console.log('Clear event received');
    socket.broadcast.emit('clear'); // Rozsyłamy zdarzenie "clear"
  });

  // Odbieranie zdarzenia "undo"
  socket.on('undo', () => {
    if (undoStack.length > 0) {
      const removedObject = undoStack.pop(); // Usuwamy ostatni element ze stosu undo
      redoStack.push(removedObject); // Dodajemy go do stosu redo
      drawingData = drawingData.filter(obj => JSON.stringify(obj) !== JSON.stringify(removedObject)); // Usuwamy go ze stanu
      console.log(`Undo event: ${JSON.stringify(removedObject)}`);
      socket.broadcast.emit('undo', removedObject); // Informujemy pozostałych o cofnięciu
    }
  });

  // Odbieranie zdarzenia "redo"
  socket.on('redo', () => {
    if (redoStack.length > 0) {
      const restoredObject = redoStack.pop(); // Przywracamy element ze stosu redo
      undoStack.push(restoredObject); // Dodajemy go do stosu undo
      drawingData.push(restoredObject); // Przywracamy go do stanu
      console.log(`Redo event: ${JSON.stringify(restoredObject)}`);
      socket.broadcast.emit('redo', restoredObject); // Informujemy pozostałych o przywróceniu
    }
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
