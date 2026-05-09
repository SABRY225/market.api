// routes/chat.js
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// المسار لجلب قائمة المحادثات للأدمن
router.get('/admin/list', chatController.getAdminChatList);

// المسار لجلب تفاصيل محادثة معينة
router.get('/details/:orderId', chatController.getChatDetails);

module.exports = router;