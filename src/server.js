require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http'); // 1. استيراد مكتبة http
const { Server } = require('socket.io'); // 2. استيراد كلاس السيرفر من socket.io
const { sequelize, syncDatabase } = require('./models');

const app = express();
app.use(cors());
app.use(express.json());

// 3. إنشاء سيرفر HTTP وربطه بـ Express
const server = http.createServer(app);

// 4. إعداد Socket.io مع إعدادات CORS
const io = new Server(server, {
  cors: {
    origin: "*", // في الإنتاج يفضل تحديد الدومين الخاص بك
  }
});

// 5. استدعاء ملف الـ Socket وتمرير الـ io له
require('./socket/chatSocket')(io);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// API v1 mounts
app.use('/api/v1/auth', require('./routes/auth.routes'));
app.use('/api/v1/admin', require('./routes/admin.routes'));
app.use('/api/v1/user', require('./routes/user.routes'));
app.use('/api/v1/vendor', require('./routes/vendor.routes'));
app.use('/api/v1/order', require('./routes/order.routes'));
app.use('/api/v1/payment', require('./routes/payment.routes'));
app.use('/api/v1/coupon', require('./routes/coupon.routes'));
app.use('/api/v1/analytics', require('./routes/analytics.routes'));
app.use('/api/v1/dispute', require('./routes/dispute.routes'));
app.use('/api/v1/client', require('./routes/client.routes'));
app.use('/api/v1/delivery', require('./routes/delivery.routes'));
app.use('/api/v1/review', require('./routes/review.routes'));
app.use("/api/v1/tickets", require("./routes/sellerTickets.routes"));
app.use("/api/v1/reports", require("./routes/sellerReports.routes"));
app.use("/api/v1/menu", require("./routes/menu.routes"));
app.use('/api/v1/chats', require('./routes/chat.routes'));
app.use('/api/v1/advertisements', require('./routes/advertisement.routes'));
app.use('/api/v1/orders-mart',  require('./routes/orderMart.routes'));
app.use('/api/v1/products-mart',  require('./routes/productMart.routes'));
app.use('/api/v1/rewards',  require('./routes/reward.routes'));
app.use('/api/v1/invitation-system',  require('./routes/invitation.routes'));
app.use('/api/v1/deliver-system',  require('./routes/deliverSystem.routes'));

const PORT = Number(process.env.PORT) || 4000;

const startServer = async () => {
  try {
    await syncDatabase(false);
    
    // 6. تغيير app.listen إلى server.listen
    server.listen(PORT, () => {
      console.log(`🚀 Server & Socket running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();