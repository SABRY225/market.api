const { DeliverSystem } = require('../models'); // تأكد من مسار الموديلز لديك

// 1. جلب إعدادات نظام التوصيل الحالية
exports.getDeliverSystem = async (req, res) => {
  try {
    // جلب السجل الأول والوحيد لإعدادات التوصيل
    let systemSetting = await DeliverSystem.findOne();

    // إذا لم تكن هناك إعدادات مسبقة في قاعدة البيانات، ننشئ سجل افتراضي
    if (!systemSetting) {
      systemSetting = await DeliverSystem.create({
        type: 'price',
        CostperOrder: 0,
        Costperkilometer: 0
      });
    }

    return res.status(200).json({
      success: true,
      data: systemSetting
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب إعدادات نظام التوصيل',
      error: error.message
    });
  }
};

// 2. تعديل إعدادات نظام التوصيل
exports.updateDeliverSystem = async (req, res) => {
  try {
    const { type, CostperOrder, Costperkilometer } = req.body;

    // التحقق من المدخلات (Validation)
    if (type && !['price', 'distance'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'نوع التوصيل يجب أن يكون إما price أو distance'
      });
    }

    // جلب السجل الحالي لتحديثه
    let systemSetting = await DeliverSystem.findOne();

    if (!systemSetting) {
      // إذا لم يكن موجوداً (حالة استثنائية)، نقوم بإنشائه
      systemSetting = await DeliverSystem.create({
        type: type || 'price',
        CostperOrder: CostperOrder || 0,
        Costperkilometer: Costperkilometer || 0
      });
    } else {
      // تحديث الحقول المرسلة فقط (Partial Update)
      if (type !== undefined) systemSetting.type = type;
      if (CostperOrder !== undefined) systemSetting.CostperOrder = CostperOrder;
      if (Costperkilometer !== undefined) systemSetting.Costperkilometer = Costperkilometer;

      await systemSetting.save();
    }

    return res.status(200).json({
      success: true,
      message: 'تم تحديث إعدادات نظام التوصيل بنجاح',
      data: systemSetting
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث نظام التوصيل',
      error: error.message
    });
  }
};