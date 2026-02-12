const { validationResult } = require('express-validator');
const { Coupon } = require('../models');

exports.all = async (req, res) => {
  try {
    const list = await Coupon.findAll({ order: [['created_at', 'DESC']] });
    return res.json(list);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.fetchSallerPromotions = async (req, res) => {
  try {
     const vendorId = req.user.sub;
    const list = await Coupon.findAll({ where:{
      vendor_id:vendorId
    },order: [['created_at', 'DESC']] });
    return res.json(list);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.add = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {

    const { code, discount, expires_at, vendor_id } = req.body;
    if(!vendor_id){
     const created = await Coupon.create({ code, discount, expires_at, vendor_id:req.user.sub });
    return res.status(201).json(created);
    }else{
      const created = await Coupon.create({ code, discount, expires_at, vendor_id });
    return res.status(201).json(created);
    }
    
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.remove = async (req, res) => {
  try {
    console.log(req.params.couponId);
    
    const coupon = await Coupon.findByPk(req.params.couponId);
    if (!coupon) return res.status(404).json({ message: 'Not found' });
    await coupon.destroy();
    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};
