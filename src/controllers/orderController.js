const { Order } = require('../models');

exports.all = async (req, res) => {
  try {
    const orders = await Order.findAll({ order: [['created_at', 'DESC']] });
    return res.json(orders);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};
exports.getOrdersVendor = async (req, res) => {
  try {
    const vendorId = req.user.sub;
    const orders = await Order.findAll({ where:{
      vendor_id:vendorId
    } ,order: [['created_at', 'DESC']] });
    return res.json(orders);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.status = async (req, res) => {
  const { orderId } = req.params;
  const { action } = req.body;
  try {
    const order = await Order.findByPk(orderId);
    if (!order) return res.status(404).json({ message: 'Not found' });
    if (action === 'remove') {
      await order.destroy();
      return res.status(204).send();
    }
    // Map some actions to status
    const mapping = {
      disable: 'cancelled',
      enable: 'processing',
    };
    if (mapping[action]) {
      await order.update({ status: mapping[action] });
      return res.json(order);
    }
    return res.json({ message: `Unknown action ${action}` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.get = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Not found' });
    return res.json(order);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};
