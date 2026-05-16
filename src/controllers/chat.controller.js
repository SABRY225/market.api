// controllers/ChatController.js
const { ChatMessage, Order, User, Delivery } = require('../models');

exports.getAdminChatList = async (req, res) => {
  try {
    const chatList = await ChatMessage.findAll({
      // جلب الحقول الأساسية فقط من الرسالة
      attributes: ['order_id', 'message', 'created_at', 'sender_type'],
      include: [
        {
          model: Order,
          as: 'order', // الربط الذي أضفناه في الخطوة رقم 1
          attributes: ['id', 'status'],
          include: [
            { 
              model: User, 
              as: 'user', // يطابق تعريفك: Order.belongsTo(User, { as: 'user' })
              attributes: ['name'] 
            },
            { 
              model: Delivery, 
              as: 'delivery', // يطابق تعريفك: Order.belongsTo(Delivery, { as: 'delivery' })
              attributes: ['username'] 
            }
          ]
        }
      ],
      // ترتيب لجعل أحدث الرسائل تظهر أولاً
      order: [['created_at', 'DESC']],
      // لمنع تكرار نفس الطلب في القائمة (Group by Order)
      group: ['order_id'] 
    });

    return res.json(chatList);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "حدث خطأ أثناء جلب المحادثات" });
  }
};
// جلب رسائل محادثة معينة بالكامل
exports.getChatDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const history = await ChatMessage.findAll({
      where: { order_id: orderId },
      order: [['created_at', 'ASC']]
    });
    return res.json(history);
  } catch (err) {
    res.status(500).json({ message: "خطأ في جلب تفاصيل المحادثة" });
  }
};