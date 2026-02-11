const express = require('express');
const router = express.Router();
const detectionController = require('../controllers/detectionController');
const telegramService = require('../services/telegramService');

// Get detection statistics
router.get('/stats', (req, res) => {
  const stats = detectionController.getStats();
  res.json({
    success: true,
    data: stats
  });
});

// Get detection history
router.get('/history', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const history = detectionController.getHistory(limit);
  res.json({
    success: true,
    count: history.length,
    data: history
  });
});

// Clear history
router.post('/history/clear', (req, res) => {
  detectionController.clearHistory();
  res.json({
    success: true,
    message: 'History cleared'
  });
});

// Reset statistics
router.post('/stats/reset', (req, res) => {
  detectionController.resetStats();
  res.json({
    success: true,
    message: 'Statistics reset'
  });
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// ========== TELEGRAM BOT ROUTES ==========

// Test Telegram bot connection
router.post('/telegram/test', async (req, res) => {
  try {
    const result = await telegramService.sendMessage('🤖 Test message from Smart AI Bin!');
    res.json({
      success: !!result,
      message: result ? 'Test message sent successfully!' : 'Failed to send message. Check bot configuration.',
      result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Send custom message via Telegram
router.post('/telegram/send', async (req, res) => {
  try {
    const { message, title, emoji } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }
    
    const result = title 
      ? await telegramService.sendCustomAlert(title, message, emoji)
      : await telegramService.sendMessage(message);
    
    res.json({
      success: !!result,
      message: result ? 'Message sent successfully!' : 'Failed to send message',
      result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Send daily summary report
router.post('/telegram/summary', async (req, res) => {
  try {
    const stats = detectionController.getStats();
    const result = await telegramService.sendDailySummary(stats);
    
    res.json({
      success: !!result,
      message: result ? 'Summary sent successfully!' : 'Failed to send summary',
      result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Manually trigger bin full alert
router.post('/telegram/bin-alert', async (req, res) => {
  try {
    const { binType, fillLevel } = req.body;
    
    if (!binType || fillLevel === undefined) {
      return res.status(400).json({
        success: false,
        error: 'binType and fillLevel are required'
      });
    }
    
    const result = await telegramService.sendBinFullAlert(binType, fillLevel);
    
    res.json({
      success: !!result,
      message: result ? 'Alert sent successfully!' : 'Failed to send alert',
      result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
