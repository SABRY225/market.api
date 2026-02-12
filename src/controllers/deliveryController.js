const { Deliver } = require("../models");

exports.login = async (req, res) => {
  const { deliveryId } = req.params;
  return res.json({ deliveryId, message: 'login not implemented' });
};
exports.all = async (req, res) => {
  try {
    const list = await Deliver.findAll({ order: [['created_at', 'DESC']] });
    return res.json(list);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.status = async (req, res) => {
  const { deliverId } = req.params;
  const { action } = req.body;
  try {
    const deliver = await Deliver.findByPk(deliverId);
    if (!deliver) return res.status(404).json({ message: 'Not found' });
    if (action === 'remove') {
      await deliver.destroy();
      return res.status(204).send();
    }
    const active = action === 'enable';
    await deliver.update({ active });
    return res.json(deliver);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.get = async (req, res) => {
  try {
    const deliver = await Deliver.findByPk(req.params.deliverId);
    if (!deliver) return res.status(404).json({ message: 'Not found' });
    return res.json(deliver);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.notification = async (req, res) => {
  return res.json([]);
};

exports.changePassword = async (req, res) => {
  return res.status(501).json({ message: 'Not implemented' });
};

exports.setting = async (req, res) => {
  return res.json({ settings: {} });
};

const { Order, User, Product } = require('../models');

exports.myorders = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const orders = await Order.findAll({
      where: { deliver_id: deliveryId },
      order: [['created_at', 'DESC']],
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] }
      ]
    });
    return res.json(orders);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};
