const { Payment, VendorWithdrawal, User } = require('../models');

const { Op } = require('sequelize'); // لازم للاستعلامات المشروطة

exports.statistics = async (req, res) => {
  try {
    // تحديد بداية ونهاية اليوم الحالي
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // عد المعاملات لليوم
    const totalTransactionsToday = await Payment.count({
      where: {
        createdAt: {
          [Op.between]: [startOfDay, endOfDay],
        },
      },
    });

    // مجموع الإيرادات لليوم
    const totalVolumeTodayResult = await Payment.sum('amount', {
      where: {
        createdAt: {
          [Op.between]: [startOfDay, endOfDay],
        },
      },
    });
    const totalVolumeAll = await Payment.sum('amount');

    return res.json({
      totalVolumeToday: Number(totalVolumeTodayResult || 0),
      totalTransactionsToday,
      totalVolumeAll: Number(totalVolumeAll || 0),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};


exports.invoices = async (req, res) => {
  try {
    const invoices = await Payment.findAll({ order: [['created_at', 'DESC']] });
    return res.json(invoices);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.vendorWithdrawalRequests = async (req, res) => {
  try {
    const requests = await VendorWithdrawal.findAll({
      order: [['created_at', 'DESC']],
      include: [{ model: User, as: 'vendor', attributes: ['id', 'name', 'email'] }]
    });
    return res.json(requests);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Approve or reject a withdrawal request
exports.vendorWithdrawalDecision = async (req, res) => {
  try {
    const { id } = req.params; // withdrawal id
    const { action, adminId, note } = req.body; // action: 'approve' | 'reject'
    if (!['approve', 'reject'].includes(action)) return res.status(400).json({ message: 'Invalid action' });
    const reqEntry = await VendorWithdrawal.findByPk(id);
    if (!reqEntry) return res.status(404).json({ message: 'Request not found' });
    if (reqEntry.status !== 'pending') return res.status(400).json({ message: 'Request already processed' });

    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    reqEntry.status = newStatus;
    reqEntry.processed_by = adminId || null;
    reqEntry.processed_at = new Date();
    if (note) reqEntry.note = note;
    await reqEntry.save();

    return res.json({ message: `Request ${newStatus}`, request: reqEntry });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};
