const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3001;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

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
      
      // In development, just emit the message without DB persistence
      // The API route will handle the actual DB save
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