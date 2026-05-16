const { User, Order, Notification, Menu, OrderItem, Delivery, Customer, Payment } = require('../models');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const { sendMail } = require('../utils/mailer');
const { Op, where } = require('sequelize');
const user = require('../models/user');
const codeStore = new Map();
const bcrypt = require("bcryptjs");
const { createNotification } = require('../utils/addNotification');

exports.statistics = async (req, res) => {
  try {
    const customers = await User.count({ where: { role: 'customer' } });
    const admins = await User.count({ where: { role: 'admin' } });
    const vendors = await User.count({ where: { role: 'vendor' } });
    const delivery = await User.count({ where: { role: 'delivery' } });
    const orders = await Order.count();
    const totalSales = await Order.sum('total', {
      where: {
        status: 'delivered'
      }
    });
    return res.json({ customers, admins, vendors, delivery, orders, totalSales: totalSales ? totalSales : 0 });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getadminInfo = async (req, res) => {
  try {
    const { token } = req.body;
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(payload.sub);
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ id: user.id, name: user.name, email: user.email });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.systemGeneral = async (req, res) => {
  // Placeholder system settings
  return res.json({ siteName: 'My Shop', currency: 'USD', timezone: 'UTC' });
};

exports.regionsShipping = async (req, res) => {
  return res.json({ topCountries: [{ country: 'Default', percentage: 0 }] });
};

exports.linkingStock = async (req, res) => {
  try {
    const totalProducts = await Menu.count({
      where: { is_available: true }
    });

    const outOfStock = await Menu.count({
      where: {
        is_available: true,
      }
    });


    res.status(200).json({
      totalProducts,
      lowStock:0,
      outOfStock
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.notifications = async (req, res) => {
  try {
    const { token } = req.body;
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(payload.sub);
    const notifications = await Notification.findAll({
      where: { type: "admin" },
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

exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { name, email } = req.body;
  try {
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(409).json({ message: 'Email already in use' });
    const user = await User.create({ name, email, role: 'admin' });
    return res.status(201).json({ id: user.id, name: user.name, email: user.email });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { email } = req.body;
  try {
    const user = await User.findOne({ where: { email, role: 'admin' } });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ sub: user.id, stage: 'pre-verify' }, process.env.JWT_SECRET, { expiresIn: '10h' });
    return res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
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

    const user = await User.findByPk(payload.sub);
    if (!user || user.role !== 'admin') return res.status(401).json({ message: 'Unauthorized' });

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
    const finalToken = jwt.sign({ sub: userId, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token: finalToken });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: 'Invalid token' });
  }
};


/**
 * GET all admins
 */
exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await User.findAll({
      where: { role: "admin" }
    });

    res.json(admins);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * CREATE admin
 */
exports.createAdmin = async (req, res) => {
  try {
    const { name, email } = req.body;

    const exists = await User.findOne({ where: { email } });
    if (exists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const admin = await User.create({
      name,
      email,
      role: "admin",
    });
    await createNotification({
      userId: admin.id, 
      title: "إضافة مسؤول جديد",
      message: `تم إضافة الأدمن ${name}`,
      type: "admin",
      data: {
        adminId: admin.id,
        email: admin.email
      }
    });
    res.status(201).json({
      message: "Admin created successfully",
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * UPDATE admin
 */
exports.updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;

    const admin = await User.findOne({
      where: { id, role: "admin" },
    });

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    if (name) admin.name = name;
    if (email) admin.email = email;
    // 🧠 حفظ القيم القديمة
    const oldName = admin.name;
    const oldEmail = admin.email;

    // تحديث البيانات
    if (name) admin.name = name;
    if (email) admin.email = email;
    await admin.save();
    // 🔔 تجهيز وصف التعديلات
    let changes = [];
    if (name && name !== oldName) {
      changes.push(`الاسم: ${oldName} → ${name}`);
    }
    if (email && email !== oldEmail) {
      changes.push(`الإيميل: ${oldEmail} → ${email}`);
    }

    // 🔔 إنشاء تنبيه
    await createNotification({
      userId: admin.id, // أو سوبر أدمن
      title: "تعديل بيانات مسؤول",
      message: changes.length
        ? `تم تعديل بيانات الأدمن (${changes.join(" , ")})`
        : `تم تحديث بيانات الأدمن بدون تغييرات واضحة`,
      type: "admin",
      data: {
        adminId: admin.id,
        oldName,
        oldEmail,
        newName: admin.name,
        newEmail: admin.email
      }
    });
    res.json({ message: "Admin updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error",error:err.message });
  }
};

/**
 * DELETE admin
 */
exports.deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await User.findOne({
      where: { id, role: "admin" },
    });

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    await admin.destroy();
    res.json({ message: "Admin deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error",error:err.message });
  }
};


exports.getUserOrders = async (req, res) => {
  try {
    // 1. تحديد المعرف (إما من البارامتر أو من التوكن)
    const userId = req.params.userId;
    
    
    // 3. بناء شرط البحث
    const whereCondition = { user_id: userId };

    // 4. جلب الطلبات مع المنتجات التابعة لها
    const orders = await Order.findAll({
      where: whereCondition,
      include: [
        {
          model: OrderItem, 
          as: 'items',
          include: [
            {
              model: Menu,
              as: 'Menu',
              attributes: ['id', 'name', 'deliveryTime'] // جلب وقت التحضير لكل وجبة
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']] // جلب الأحدث أولاً
    });

    return res.status(200).json(orders);

  } catch (error) {
    return res.status(500).json({ message: "حدث خطأ أثناء جلب الطلبات: " + error.message });
  }
};
exports.getDelivery = async (req, res) => {
  try {
    const deliver = await Delivery.findOne({where:{user_id:req.params.deliveryId}});
    if (!deliver) return res.status(404).json({ message: "Not found" });
    return res.json(deliver);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getDeliveryOrders = async (req, res) => {
  try {
    const deliver = await Delivery.findOne({where:{user_id:req.params.deliveryId}});
    const orders = await Order.findAll({
      where: {
        delivery_id: deliver.id,
      },
      order: [["created_at", "DESC"]],
      include: [
        {
          model: User,
          as: "user",
          include: [{ model: Customer, as: "customer" }],
        },
        {
          model: Payment,
          as: "payment",
        },
        {
          model: OrderItem,
          as: "items",
          include: {
            model: Menu,
            as: "Menu",
          },
        },
      ],
    });

    // 2. التحقق من وجود طلبات لتجنب خطأ Map على Null
    if (!orders || orders.length === 0) {
      return res.json([]);
    }

    // 3. تحويل البيانات للشكل المطلوب في الـ Front-end
    const formattedOrders = orders.map((order) => {
      return {
        id: `${order.id}`,
        customer: order.user?.name,
        phone: order.user?.Customer?.phone,
        status: order.status,
        startTime: new Date(order.createdAt).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
        location: [order.longitude, order.latitude],
        items: order.items.map((item) => ({
          name: item.Menu.name,
          price: parseFloat(item.price).toFixed(3),
        })),
        total: order.total,
        payment: order.payment.method,
        showMap: false,
      };
    });

    return res.json(formattedOrders);
  } catch (err) {
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};