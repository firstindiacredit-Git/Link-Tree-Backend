const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(cors({
  origin: ['http://localhost:5173', 'https://link-tree-frontend-sooty.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());


mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 30000, // Timeout after 30 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  connectTimeoutMS: 30000, // Connection attempt timeout
  heartbeatFrequencyMS: 10000, // 10 seconds between heartbeats
  retryWrites: true,
  w: 'majority'
})
.then(() => console.log('Connected to MongoDB successfully'))
.catch((err) => {
  console.error('MongoDB connection error:', err);
  // Don't exit the process, let the server run anyway
  console.log('Server will continue running, but database operations may fail');
});

// Add connection error handler
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error after initial connection:', err);
});

// Add connection success handler after reconnect
mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnection successful');
});

app.get('/', (req, res) => {
  res.send('welcome to linktree backend');
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
