const { Notification, User } = require("../models");
const { sendEmail } = require("./emailService");

exports.createNotification = async (userId, title, message) => {
  try {
    // 1. الحفظ في جدول التنبيهات
    await Notification.create({
      user_id: userId,
      title,
      message
    });

    // 2. جلب إيميل المستخدم وإرسال رسالة له
    const user = await User.findByPk(userId);
    if (user && user.email) {
      await sendEmail(user.email, title, message);
    }
  } catch (error) {
    console.error("فشل إرسال التنبيه:", error);
  }
};