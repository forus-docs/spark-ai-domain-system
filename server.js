const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
require('dotenv').config();

// Models will be loaded when needed via mongoose.model()

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3001;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/spark-ai')
  .then(() => console.log('MongoDB connected for Socket.io server'))
  .catch(err => console.error('MongoDB connection error:', err));

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new Server(server, {
    cors: {
      origin: `http://localhost:${port}`,
      methods: ['GET', 'POST'],
    },
  });

  // Socket.io connection handling
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join a workstream room
    socket.on('join-workstream', ({ workstreamId, userId }) => {
      socket.join(workstreamId);
      console.log(`User ${userId} joined workstream ${workstreamId}`);
      
      // Notify others in the room
      socket.to(workstreamId).emit('user-joined', { userId });
    });

    // Leave a workstream room
    socket.on('leave-workstream', ({ workstreamId, userId }) => {
      socket.leave(workstreamId);
      console.log(`User ${userId} left workstream ${workstreamId}`);
      
      // Notify others in the room
      socket.to(workstreamId).emit('user-left', { userId });
    });

    // Handle sending messages
    socket.on('send-message', async ({ workstreamId, message }) => {
      console.log('Message received:', message);
      
      // The actual DB persistence happens via the API route
      // Socket.io just handles real-time distribution
      io.to(workstreamId).emit('new-message', message);
    });

    // Handle typing indicators
    socket.on('typing-start', ({ workstreamId, userId, userName }) => {
      socket.to(workstreamId).emit('user-typing', { userId, userName });
    });

    socket.on('typing-stop', ({ workstreamId, userId }) => {
      socket.to(workstreamId).emit('user-stopped-typing', { userId });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  server.once('error', (err) => {
    console.error(err);
    process.exit(1);
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});