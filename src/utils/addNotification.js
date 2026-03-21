const { Notification } = require("../models");

// إنشاء تنبيه جديد
exports.createNotification = async ({
  userId,
  title,
  message = null,
  type = null,
  data = null
}) => {
  try {
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      data
    });

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};