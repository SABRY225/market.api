const { Dispute, SupportTicket, User } = require('../models');

exports.all = async (req, res) => {
  try {
    const list = await Dispute.findAll({ order: [['created_at', 'DESC']] });
    return res.json(list);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getSallerTickets = async (req, res) => {
  try {
    const list = await Dispute.findAll({where:{
      
    } ,order: [['created_at', 'DESC']] });
    return res.json(list);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.create = async (req, res) => {
  try {
    const { order_id, user_id, reason } = req.body;
    if (!order_id || !user_id) return res.status(400).json({ message: 'order_id and user_id are required' });
    const dispute = await Dispute.create({ order_id, user_id, reason });
    return res.status(201).json(dispute);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// create a support ticket as a reply to a dispute
exports.reply = async (req, res) => {
  const { disputeId } = req.params;
  const { subject, message, owner_id } = req.body;
  try {
    const dispute = await Dispute.findByPk(disputeId);
    if (!dispute) return res.status(404).json({ message: 'Dispute not found' });

    // create a support ticket linked to this dispute
    const ticket = await SupportTicket.create({
      owner_id: dispute.id,
      owner_type: 'dispute',
      subject: subject || `رد على الشكوى #${dispute.id}`,
      message: message || '',
    });

    return res.status(201).json(ticket);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.status = async (req, res) => {
  const { disputeId } = req.params;
  const { action } = req.body;
  try {
    const dispute = await Dispute.findByPk(disputeId);
    if (!dispute) return res.status(404).json({ message: 'Not found' });
    if (action === 'remove') {
      await dispute.destroy();
      return res.status(204).send();
    }
    // map actions to statuses
    const mapping = { investigate: 'investigating', resolve: 'resolved', reject: 'rejected' };
    if (mapping[action]) {
      await dispute.update({ status: mapping[action] });
      return res.json(dispute);
    }
    return res.json({ message: `Unknown action ${action}` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};
