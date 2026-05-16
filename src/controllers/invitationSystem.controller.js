const { InvitationSystem } = require('../models'); // تأكد من المسارات لديك

// 1. جلب النقاط الحالية المحددة لنظام الدعوات
exports.getSystemPoints = async (req, res) => {
  try {
    // ن جلب السجل الأول دائماً لأنه يمثل الإعدادات العامة
    let systemSetting = await InvitationSystem.findOne();
    
    // إذا كان الجدول فارغاً تماماً في البداية، ننشئ سجل افتراضي
    if (!systemSetting) {
      systemSetting = await InvitationSystem.create({ points: 0 });
    }

    return res.status(200).json({ success: true, data: systemSetting });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 2. تعديل نقاط نظام الدعوات (للأدمن)
exports.updateSystemPoints = async (req, res) => {
  try {
    const { points } = req.body;

    if (points === undefined || isNaN(points) || points < 0) {
      return res.status(400).json({ success: false, message: 'برجاء إدخال عدد نقاط صحيح' });
    }

    // نحدث السجل الأول والوحيد في الجدول
    const systemSetting = await InvitationSystem.findOne();
    if (systemSetting) {
      systemSetting.points = points;
      await systemSetting.save();
    } else {
      await InvitationSystem.create({ points });
    }

    return res.status(200).json({ success: true, message: 'تم تحديث نقاط نظام الدعوات بنجاح' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
