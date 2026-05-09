module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('⚡ New client connected:', socket.id);

    socket.on('join_chat', (orderId) => {
      socket.join(`order_${orderId}`);
      console.log(`📁 User joined room: order_${orderId}`);
    });

    socket.on('send_message', async (data) => {
      try {
        // هنا يمكنك حفظ الرسالة في قاعدة البيانات باستخدام Sequelize
        // const { ChatMessage } = require('../models');
        // const newMessage = await ChatMessage.create(data);
        
        // إرسال الرسالة للغرفة
        io.to(`order_${data.order_id}`).emit('new_message', data);
      } catch (err) {
        console.error("Socket Error:", err);
      }
    });

    socket.on('disconnect', () => {
      console.log('❌ Client disconnected');
    });
  });
};