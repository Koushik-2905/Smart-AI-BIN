require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const mqttService = require('./services/mqttService');
const socketService = require('./services/socketService');
const detectionController = require('./controllers/detectionController');
const rewardsController = require('./controllers/rewardsController');
const activeUserStore = require('./services/activeUserStore');
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');
const rewardsRoutes = require('./routes/rewards');
const adminRoutes = require('./routes/admin');
const mqttConfig = require('./config/mqtt');
const { initDatabase } = require('./database/init');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

// Routes
app.use('/api', apiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/rewards', rewardsRoutes);
app.use('/api/admin', adminRoutes);

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
mqttService.onMessage(mqttConfig.topics.detection, async (data) => {
  console.log('Detection received:', data);
  
  // Process detection
  const result = detectionController.processDetection(data);
  
  // Emit to connected clients
  socketService.emitDetectionUpdate(data);
  
  // Auto-credit points when plastic or e-waste is segregated
  const activeUserId = activeUserStore.getActiveUser();
  if (activeUserId) {
    const normalizeWasteType = (value) => {
      if (!value) return null;
      const v = String(value).trim().toLowerCase();
      if (['dry', 'plastic', 'plastics'].includes(v)) return 'dry';
      if (['electronic', 'e-waste', 'ewaste', 'e_waste'].includes(v)) return 'electronic';
      if (['wet', 'organic'].includes(v)) return 'wet';
      return null;
    };

    const objectTypes = Array.isArray(data.objects)
      ? data.objects.map(obj => normalizeWasteType(obj?.class)).filter(Boolean)
      : [];
    const destinationType = normalizeWasteType(data.destination);
    const labelType = normalizeWasteType(data.label);

    // Prefer object classes first; destination can be "processing" for multi-object detections.
    let wasteType = objectTypes.find(t => t === 'electronic')
      || objectTypes.find(t => t === 'dry')
      || destinationType
      || labelType;

    const isReject = (
      data.destination === 'reject'
      || (data.confidence !== undefined && data.confidence < 0.65)
    );
    const isEligible = wasteType === 'dry' || wasteType === 'electronic';
    if (isEligible && !isReject) {
      try {
        const updated = await rewardsController.creditFromBin(activeUserId, wasteType);
        if (updated) {
          console.log(`Credited user ${activeUserId}: ${wasteType} (+${wasteType === 'dry' ? 5 : 10} pts)`);
          socketService.emitCreditUpdate({ user_id: activeUserId, waste_type: wasteType, credits: updated.credits });
        }
      } catch (err) {
        console.error('Auto-credit from bin failed:', err);
      }
    }
  }
});

mqttService.onMessage(mqttConfig.topics.binStatus, (data) => {
  console.log('Bin status update:', data);
  socketService.emitBinStatus(data);
});

mqttService.onMessage(mqttConfig.topics.system, (data) => {
  console.log('System status:', data);
  socketService.emitSystemStatus(data);
});

mqttService.onMessage(mqttConfig.topics.alerts, (data) => {
  console.log('Alert:', data);
  socketService.emitAlert(data);
});

// Connect to MQTT broker
mqttService.connect();

// Initialize database
initDatabase().catch(err => {
  console.error('Failed to initialize database:', err);
});

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
  mqttService.disconnect();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;
