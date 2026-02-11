require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const morgan = require('morgan');

const mqttService = require('./services/mqttService');
const socketService = require('./services/socketService');
const telegramService = require('./services/telegramService');
const detectionController = require('./controllers/detectionController');
const apiRoutes = require('./routes/api');
const mqttConfig = require('./config/mqtt');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
}));
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api', apiRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Smart AI Bin Server',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      stats: '/api/stats',
      history: '/api/history',
      health: '/api/health'
    }
  });
});

// Initialize Socket.IO
socketService.initialize(server);

// Setup MQTT message handlers
mqttService.onMessage(mqttConfig.topics.detection, (data) => {
  console.log('Detection received:', data);
  
  // Process detection
  const result = detectionController.processDetection(data);
  
  // Emit to connected clients
  socketService.emitDetectionUpdate(data);
  
  // Send Telegram notification for detections
  if (data.destination && data.destination !== 'none') {
    telegramService.sendDetectionAlert(data);
  }
});

mqttService.onMessage(mqttConfig.topics.binStatus, (data) => {
  console.log('Bin status update:', data);
  socketService.emitBinStatus(data);
  
  // Check for full bins and send alerts
  if (data.levels) {
    Object.entries(data.levels).forEach(([binType, level]) => {
      if (level >= 80) {
        telegramService.sendBinFullAlert(binType, level);
      }
    });
  }
});

mqttService.onMessage(mqttConfig.topics.system, (data) => {
  console.log('System status:', data);
  socketService.emitSystemStatus(data);
  
  // Send system alerts to Telegram
  if (data.status && data.message) {
    telegramService.sendSystemAlert(data.status, data.message);
  }
});

mqttService.onMessage(mqttConfig.topics.alerts, (data) => {
  console.log('Alert:', data);
  socketService.emitAlert(data);
  
  // Send custom alerts to Telegram
  if (data.title && data.message) {
    telegramService.sendCustomAlert(data.title, data.message, data.emoji);
  }
});

// Connect to MQTT broker
mqttService.connect();

// Send startup notification
setTimeout(() => {
  telegramService.sendStartupNotification();
}, 2000);

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('\n========================================');
  console.log('  Smart AI Bin Server');
  console.log('========================================');
  console.log(`Server running on port ${PORT}`);
  console.log(`MQTT broker: ${mqttConfig.getBrokerUrl()}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('========================================\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  telegramService.sendSystemAlert('shutdown', 'Server shutting down gracefully');
  mqttService.disconnect();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;
