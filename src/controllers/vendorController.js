const { validationResult } = require('express-validator');
const { Vendor, User, Order,Category, Notification } = require('../models');
const { Op, fn, col, literal } = require("sequelize");
const { sendMail } = require('../utils/mailer');
const jwt = require('jsonwebtoken');
const codeStore = new Map(); // key: userId, value: { code, expiresAt }

exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { email } = req.body;
  try {
    const user = await User.findOne({ 
      where: { email, role: 'vendor' },
      include: [
        {
          model: Vendor,
          as: 'vendor' // تأكد أن هذا الاسم يطابق الـ alias في ملف الموديلات
        }
      ]
    });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ sub: user.vendor.id, stage: 'pre-verify' }, process.env.JWT_SECRET, { expiresIn: '10h' });
    return res.json({ token, user: { id: user.vendor.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.sendCode = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { token } = req.body;
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (payload.stage !== 'pre-verify') return res.status(401).json({ message: 'Invalid stage' });

    const user = await Vendor.findByPk(payload.sub);
    if (!user ) return res.status(401).json({ message: 'Unauthorized' });

    const code = String(Math.floor(10000 + Math.random() * 90000));
    const expiresAt = Date.now() + 5 * 60 * 1000;

    codeStore.set(user.id, { code, expiresAt });

    const subject = `رمز التحقق الخاص بك: ${code}`;

    // تصميم البريد الإلكتروني الاحترافي
    const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
        <style>
            .email-container {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                max-width: 600px;
                margin: 0 auto;
                background-color: #f9fafb;
                padding: 20px;
                border-radius: 12px;
            }
            .header {
                text-align: center;
                padding-bottom: 20px;
            }
            .card {
                background-color: #ffffff;
                padding: 40px;
                border-radius: 16px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                text-align: center;
            }
            .logo {
                font-size: 24px;
                font-weight: bold;
                color: #2563eb;
                margin-bottom: 20px;
            }
            .title {
                color: #1f2937;
                font-size: 22px;
                margin-bottom: 8px;
            }
            .subtitle {
                color: #6b7280;
                font-size: 16px;
                margin-bottom: 30px;
            }
            .code-box {
                background-color: #eff6ff;
                border: 2px dashed #bfdbfe;
                padding: 15px;
                border-radius: 12px;
                font-size: 36px;
                font-weight: bold;
                color: #1e40af;
                letter-spacing: 10px;
                margin: 20px 0;
                display: inline-block;
                width: 80%;
            }
            .footer {
                text-align: center;
                margin-top: 25px;
                color: #9ca3af;
                font-size: 12px;
            }
            .warning {
                color: #991b1b;
                background-color: #fef2f2;
                padding: 10px;
                border-radius: 8px;
                font-size: 13px;
                margin-top: 20px;
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <div class="logo">لوحة التحكم</div>
            </div>
            <div class="card">
                <h1 class="title">رمز التحقق من الهوية</h1>
                <p class="subtitle">استخدم الرمز التالي لإكمال عملية تسجيل الدخول إلى حساب المسؤول الخاص بك.</p>
                
                <div class="code-box">${code}</div>
                
                <p style="color: #4b5563;">هذا الرمز صالح لمدة <strong>5 دقائق</strong> فقط.</p>
                
                <div class="warning">
                    إذا لم تطلب هذا الرمز، يرجى تجاهل هذا البريد الإلكتروني أو تأمين حسابك.
                </div>
            </div>
            <div class="footer">
                &copy; ${new Date().getFullYear()} نظام إدارة المسؤولين. جميع الحقوق محفوظة.
            </div>
        </div>
    </body>
    </html>
    `;

    const text = `رمز التحقق الخاص بك هو: ${code}. تنتهي صلاحيته خلال 5 دقائق.`;

    await sendMail({ to: user.email, subject, text, html });

    return res.json({ message: 'Code sent' });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: 'Invalid token' });
  }
};

exports.verifyCode = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { token, code } = req.body;
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.stage !== 'pre-verify') return res.status(401).json({ message: 'Invalid stage' });
    const userId = payload.sub;
    const entry = codeStore.get(userId);
    if (!entry) return res.status(400).json({ message: 'No code requested' });
    if (Date.now() > entry.expiresAt) return res.status(400).json({ message: 'Code expired' });
    if (entry.code !== code) return res.status(400).json({ message: 'Invalid code' });
    codeStore.delete(userId);
    const finalToken = jwt.sign({ sub: userId, role: 'vendor' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token: finalToken });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: 'Invalid token' });
  }
};

exports.getVendorInfo = async (req, res) => {
  try {
    const id =req.user.sub;
    const user = await Vendor.findByPk(id);
    return res.json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};


exports.vendorStatistics = async (req, res) => {
  try {
    
    const vendorId = req.user.sub;

    // بداية ونهاية اليوم
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // بداية الشهر الحالي
    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    );

    /* =======================
       1️⃣ مبيعات اليوم
    ======================= */
    const todaySales = await Order.sum("total", {
      where: {
        vendor_id: vendorId,
        status: "delivered",
        created_at: {
          [Op.between]: [startOfDay, endOfDay],
        },
      },
    });

    /* =======================
       2️⃣ طلبات اليوم الجديدة
    ======================= */
    const todayOrders = await Order.count({
      where: {
        vendor_id: vendorId,
        status: "pending",
        created_at: {
          [Op.between]: [startOfDay, endOfDay],
        },
      },
    });

    /* =======================
       3️⃣ عدد طلبات الشهر الحالي
    ======================= */
    const monthlyOrders = await Order.count({
      where: {
        vendor_id: vendorId,
        created_at: {
          [Op.gte]: startOfMonth,
        },
      },
    });

    return res.json({
      vendor_id: vendorId,
      today_sales: Number(todaySales || 0),
      today_orders: todayOrders,
      monthly_orders: monthlyOrders,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};


exports.notifications = async (req, res) => {
  try {
     const vendorId = req.user.sub;

    const notifications = await Notification.findAll({
      where: { userId: vendorId },
      order: [['createdAt', 'DESC']],
      limit: 50,
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }]
    });
    return res.json(notifications);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * POST /vendors/:vendorId/categories
 */
exports.createCategoryForVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { name } = req.body;

    // تأكد إن البائع موجود
    const vendor = await Vendor.findByPk(vendorId);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    const category = await Category.create({
      vendor_id: vendorId,
      name
    });

    return res.status(201).json({
      message: "Category created successfully",
      data: {
        id: category.id,
        name: category.name,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};
/**
 * GET /vendors/:vendorId/menu
 */
exports.getVendorMenu = async (req, res) => {
  try {
    const { vendorId } = req.params;

    const categories = await Category.findAll({
      where: {
        vendor_id: vendorId,
        is_active: true,
      },
      attributes: ["id", "name"],
      include: [
        {
          model: Menu,
          as: "menus",
          attributes: ["id", "name", "price", ["description", "desc"]],
          where: { is_available: true },
          required: false,
        },
      ],
      order: [["id", "ASC"]],
    });

    // تشكيل الريسبونس بالشكل المطلوب
    const response = categories.map((category) => ({
      id: category.id,
      name: category.name,
      items: category.menus.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        desc: item.desc,
      })),
    }));

    return res.json(response);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.all = async (req, res) => {
  try {
    const vendors = await Vendor.findAll({ order: [['created_at', 'DESC']] });
    return res.json(vendors);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.status = async (req, res) => {
  const { vendorId } = req.params;
  const { action } = req.body; // disable | enable | remove
  try {
    const vendor = await Vendor.findByPk(vendorId);
    if (!vendor) return res.status(404).json({ message: 'Not found' });
    if (action === 'remove') {
      await vendor.destroy();
      return res.status(204).send();
    }
    const active = action === 'enable';
    await vendor.update({ active });
    return res.json(vendor);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.get = async (req, res) => {
  try {
    const vendor = await Vendor.findByPk(req.params.vendorId);
    if (!vendor) return res.status(404).json({ message: 'Not found' });
    return res.json(vendor);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};
