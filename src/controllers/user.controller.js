const { where } = require('sequelize');
const { User, Order, Vendor, Menu } = require('../models');

exports.allCustomers = async (req, res) => {
  try {
    const users = await User.findAll({where: {role: 'customer'}, order: [['created_at', 'DESC']] });
    return res.json(users);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};
exports.allVendors = async (req, res) => {
  try {
    const users = await User.findAll({where: {role: 'vendor'}, order: [['created_at', 'DESC']],include: ['vendor'] });
    return res.json(users);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getVendorById = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await Vendor.findOne({where: {user_id: userId}});
    if (!user) return res.status(404).json({ message: 'Not found' });
    return res.json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  } 
};
exports.allDelivery = async (req, res) => {
  try {
    const users = await User.findAll({where: {role: 'delivery'}, order: [['created_at', 'DESC']] });
    return res.json(users);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};
exports.status = async (req, res) => {
  const { userId } = req.params;
  const { action } = req.body; // disable | enable | remove
  try {
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'Not found' });
    if (action === 'remove') {
      await user.destroy();
      return res.status(204).send();
    }
    if (action === 'disable') {
      user.status = 'disabled';
      await user.save();
      return res.json({ message: 'User disabled' });
    }
    if (action === 'enable') {
      user.status = 'active';
      await user.save();
      return res.json({ message: 'User enabled' });
    }
    // No status column present: return informational response
    return res.json({ message: `Action '${action}' applied to user ${userId}` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getCustomer = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId);
    if (!user) return res.status(404).json({ message: 'Not found' });
    const orders = await Order.findAll({ where: { user_id: user.id }, order: [['created_at', 'DESC']] });
    return res.json({ user, orders });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getVendor = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId);
    if (!user) return res.status(404).json({ message: 'Not found' });
    const products = await Menu.findAll({ where: { vendor_id: user.id }, order: [['created_at', 'DESC']] });
    const orders = await Order.findAll({ where: { vendor_id: user.id }, order: [['created_at', 'DESC']] });
    return res.json({ user, products, orders });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getDelivery = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId);
    if (!user) return res.status(404).json({ message: 'Not found' });
    const orders = await Order.findAll({
      where: { deliver_id: user.id },
      order: [['created_at', 'DESC']],
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] }
      ]
    });
    return res.json({ user, orders });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};