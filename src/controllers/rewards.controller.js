const { Reward } = require('../models'); // تأكد من المسار الصحيح للموديلز لديك

// 1. جلب جميع المكافآت ليراها الأدمن في لوحة التحكم
exports.getAllRewards = async (req, res) => {
  try {
    const rewards = await Reward.findAll({
      // يمكنك ترتيبها حسب المعرف أو تاريخ الإنشاء
      order: [['id', 'ASC']] 
    });
    
    return res.status(200).json({
      success: true,
      data: rewards
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب المكافآت',
      error: error.message
    });
  }
};

// 2. تعديل عدد النقاط فقط لمكافأة معينة
exports.updateRewardPoints = async (req, res) => {
  try {
    const { id } = req.params; // جلب رقم المكافأة من الرابط
    const { points_required } = req.body; // جلب عدد النقاط الجديد من الـ Request Body

    // التحقق من أن الأدمن أرسل النقاط وأنها رقم صحيح وموجب
    if (points_required === undefined || isNaN(points_required) || points_required < 0) {
      return res.status(400).json({
        success: false,
        message: 'برجاء إدخال عدد نقاط صحيح وموجب'
      });
    }

    // تحديث النقاط فقط في قاعدة البيانات
    const [updatedRows] = await Reward.update(
      { points_required: points_required }, // الحقل المراد تعديله فقط
      { where: { id: id } } // الشرط (تعديل المكافأة ذات الـ id المحدد)
    );

    // التحقق مما إذا كانت المكافأة موجودة بالفعل وتم تحديثها
    if (updatedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'المكافأة غير موجودة'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'تم تحديث نقاط المكافأة بنجاح'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث النقاط',
      error: error.message
    });
  }
};