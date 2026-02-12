const { validationResult } = require('express-validator');
const { User, CartItem, Favorite, Review, Customer, Order , Vendor, Category, Menu, OrderItem } = require('../models');
const bcrypt = require("bcryptjs");
const { Sequelize, where } = require('sequelize');
const jwt = require('jsonwebtoken');
const { sendMail } = require('../utils/mailer');
const codeStore = new Map();

exports.topResturant = async (req, res) => {
  try {
    
    const restaurants = await Vendor.findAll({
      attributes: [
        'id',
        'name_en',
        'image_url',
        // ⭐ متوسط التقييم
        [
          literal(`(
        SELECT COALESCE(AVG(r.rating), 0)
        FROM reviews r
        JOIN menus m ON m.id = r.menu_id
        WHERE m.vendor_id = Vendor.id
          AND r.status = 'approved'
      )`),
          'avgRating'
        ],

        // 👥 عدد العملاء (Users مميزين)
        [
          literal(`(
        SELECT COUNT(DISTINCT o.user_id)
        FROM orders o
        WHERE o.vendor_id = Vendor.id
          AND o.status = 'delivered'
      )`),
          'buyersCount'
        ],

        // 🍽️ عدد المينيو
        [
          literal(`(
        SELECT COUNT(*)
        FROM menus m
        WHERE m.vendor_id = Vendor.id
      )`),
          'menusCount'
        ],
      ],

    });
    return res.json(restaurants);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};
exports.getUserInfo = async (req, res) => {
  try {
    const {id} = req.params;
    const user = await User.findByPk(id);
    const customer = await Customer.findOne({where:{user_id:id}});
     return res.status(200).json({
      name:user.name,
      email:user.email,
      user_id:customer.user_id,
      phone:customer.phone,
      address:customer.address,
      city:customer.city,
      createdAt:customer.createdAt,
      updatedAt:customer.updatedAt,
      isActive:customer.is_active,
     })
  } catch (error) {
    return res.status(500).json({ message: error.message });
    
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    if (req.params.id) {
          const {id} = req.params;
    const User = await Order.findAll({where:{user_id:id}});
     return res.status(200).json(User)
    }else{
    const User = await Order.findAll({where:{user_id:req.user.id}});
     return res.status(200).json(User)
    }

  } catch (error) {
    return res.status(500).json({ message: error.message });
    
  }
};

exports.topReviews = async (req, res) => {
  try {
    const reviews = await Review.findAll({ order: [['created_at', 'DESC']], limit: 10 });
    return res.json(reviews);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};


exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ تحقق من المدخلات
    if (!email || !password) {
      return res.status(400).json({
        message: "الإيميل وكلمة المرور مطلوبين",
      });
    }

    // 2️⃣ البحث عن المستخدم
    const user = await User.findOne({
      where: { email },
      include: [
        {
          model: Customer,
          attributes: ["id", "phone", "city", "wallet_balance"],
        },
      ],
    });

    if (!user) {
      return res.status(401).json({
        message: "بيانات الدخول غير صحيحة",
      });
    }

    // 3️⃣ مقارنة الباسورد
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        message: "بيانات الدخول غير صحيحة",
      });
    }

    // 4️⃣ إنشاء التوكن
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // 5️⃣ الريسبونس
    return res.status(200).json({
      message: "تم تسجيل الدخول بنجاح",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        customer: user.Customer || null,
      },
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "حدث خطأ أثناء تسجيل الدخول",
    });
  }
};

exports.registerCustomer = async (req, res) => {
  try {
    const { fullName, email, password, phone, address, city } = req.body;

    // 1️⃣ تحقق من البيانات
    if (!fullName || !email || !password || !phone) {
      return res.status(400).json({
        message: "البيانات الأساسية مطلوبة",
      });
    }

    // 2️⃣ تحقق من الإيميل
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        message: "الإيميل مستخدم بالفعل",
      });
    }

    // 3️⃣ تشفير الباسورد
    const passwordHash = await bcrypt.hash(password, 10);

    // 4️⃣ إنشاء User
    const user = await User.create({
      name:fullName,
      email,
      passwordHash,
      role: "customer",
    });

    // 5️⃣ إنشاء Customer
    const customer = await Customer.create({
      user_id: user.id,
      phone,
      address:"",
      city:"",
    });

    return res.status(201).json({
      message: "تم إنشاء الحساب بنجاح",
      status:200,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        customer,
      },
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "حدث خطأ أثناء التسجيل",
    });
  }
};


exports.sendCode = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { email } = req.body;

    const user = await User.findOne({where:{email}});
    if (!user || user.role !== 'customer') return res.status(401).json({ message: 'Unauthorized' });

    const code = String(Math.floor(10000 + Math.random() * 90000));
    const expiresAt = Date.now() + 5 * 60 * 1000;

    codeStore.set(user.id, { code, expiresAt });

    const subject = `رمز التحقق الخاص بك: ${code}`;

    // تصميم البريد الإلكتروني الاحترافي
    const html = `
   <!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>رمز التحقق</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f3f4f6;
    }
    .email-wrapper {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      padding: 30px 15px;
    }
    .email-container {
      max-width: 600px;
      margin: auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
    }
    .header {
      background: linear-gradient(135deg, #2563eb, #1e40af);
      padding: 25px;
      text-align: center;
      color: #ffffff;
    }
    .logo {
      font-size: 22px;
      font-weight: bold;
      letter-spacing: 1px;
    }
    .content {
      padding: 40px 30px;
      text-align: center;
    }
    .title {
      font-size: 22px;
      color: #111827;
      margin-bottom: 10px;
    }
    .subtitle {
      font-size: 16px;
      color: #6b7280;
      margin-bottom: 30px;
      line-height: 1.7;
    }
    .code-box {
      display: inline-block;
      background-color: #eff6ff;
      border: 2px dashed #93c5fd;
      border-radius: 14px;
      padding: 18px 30px;
      font-size: 34px;
      font-weight: 700;
      color: #1e3a8a;
      letter-spacing: 12px;
      margin-bottom: 25px;
    }
    .expire-text {
      font-size: 14px;
      color: #374151;
      margin-bottom: 25px;
    }
    .warning {
      background-color: #fef2f2;
      color: #991b1b;
      font-size: 13px;
      padding: 14px;
      border-radius: 10px;
      line-height: 1.6;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #9ca3af;
      padding: 18px;
      background-color: #f9fafb;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      
      <!-- Header -->
      <div class="header">
        <div class="logo">لوحة التحكم</div>
      </div>

      <!-- Content -->
      <div class="content">
        <h1 class="title">رمز التحقق الخاص بك</h1>
        <p class="subtitle">
          لقد تلقينا طلبًا لتأكيد هويتك.  
          استخدم الرمز التالي لإكمال العملية بأمان.
        </p>

        <div class="code-box">${code}</div>

        <p class="expire-text">
          هذا الرمز صالح لمدة <strong>5 دقائق</strong> فقط.
        </p>

        <div class="warning">
          ⚠️ في حال لم تقم بطلب هذا الرمز، يرجى تجاهل الرسالة فورًا وعدم مشاركة الرمز مع أي شخص.
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        © ${new Date().getFullYear()} نظام إدارة المستخدمين — جميع الحقوق محفوظة
      </div>

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
exports.forgetPassword = async (req, res) => {
try {
    const { email, password, code } = req.body;

    // 1️⃣ تحقق من البيانات
    if (!email || !password || !code) {
      return res.status(400).json({
        message: "جميع الحقول مطلوبة",
      });
    }

    // 2️⃣ تحقق من المستخدم
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({
        message: "المستخدم غير موجود",
      });
    }

    // 3️⃣ تحقق من الكود
    const entry = codeStore.get(user.id);
    if (!entry) {
      return res.status(400).json({
        message: "لم يتم طلب رمز تحقق",
      });
    }

    if (Date.now() > entry.expiresAt) {
      return res.status(400).json({
        message: "انتهت صلاحية الرمز",
      });
    }

    if (entry.code !== code) {
      return res.status(400).json({
        message: "رمز التحقق غير صحيح",
      });
    }

    // 4️⃣ تحديث كلمة المرور
    const passwordHash = await bcrypt.hash(password, 10);
    user.passwordHash = passwordHash;

    await user.save();
    codeStore.delete(user.id);

    return res.status(200).json({
      message: "تم تعيين كلمة المرور بنجاح",
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "خطأ في السيرفر",
    });
  }
};

// cart
exports.addToCart = async (req, res) => {
  const userId = req.user.id;
  const { product_id, quantity = 1 } = req.body;

  try {
    const product = await Menu.findByPk(product_id);
    if (!product || !product.is_available) {
      return res.status(404).json({ message: "المنتج غير متاح" });
    }

    const existingItem = await CartItem.findOne({
      where: { user_id: userId, menu_id:product_id },
    });

    if (existingItem) {
      existingItem.quantity += quantity;
      await existingItem.save();

      return res.json({
        success: true,
        message: "تم تحديث الكمية",
        data: existingItem,
      });
    }

    const cartItem = await CartItem.create({
      user_id: userId,
      menu_id:product_id,
      quantity,
    });

    res.status(201).json({
      success: true,
      message: "تمت إضافة المنتج للسلة",
      data: cartItem,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "خطأ في السيرفر" });
  }
};
exports.getCartItems = async (req, res) => {
  const userId = req.user.id;
  try {
    const items = await CartItem.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Menu,
          as:"menu",
          attributes: [
            "id",
            "name",
            "image",
            "price",
            "type",
            "price_before_discount",
            "discount_percentage",
          ],
        },
      ],
    });

    res.json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "خطأ في السيرفر" });
  }
};
exports.updateCartItem = async (req, res) => {
  const userId = req.user.id;
  const { itemId } = req.params;
  const { quantity } = req.body;

  if (quantity < 1) {
    return res.status(400).json({ message: "الكمية غير صحيحة" });
  }

  try {
    const item = await CartItem.findOne({
      where: { id: itemId, user_id: userId },
    });

    if (!item) {
      return res.status(404).json({ message: "العنصر غير موجود" });
    }

    item.quantity = quantity;
    await item.save();

    res.json({
      success: true,
      message: "تم تحديث الكمية",
      data: item,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "خطأ في السيرفر" });
  }
};
exports.deleteCartItem = async (req, res) => {
  const userId = req.user.id;
  const { itemId } = req.params;

  try {
    const deleted = await CartItem.destroy({
      where: { id: itemId, user_id: userId },
    });

    if (!deleted) {
      return res.status(404).json({ message: "العنصر غير موجود" });
    }

    res.json({
      success: true,
      message: "تم حذف العنصر من السلة",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "خطأ في السيرفر" });
  }
};
exports.clearCart = async (req, res) => {
  const userId = req.user.id;

  try {
    await CartItem.destroy({ where: { user_id: userId } });

    res.json({
      success: true,
      message: "تم تفريغ السلة",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "خطأ في السيرفر" });
  }
};

// Favorite
exports.addToFavorite = async (req, res) => {
  const userId = req.user.id;
  const { product_id } = req.body;

  try {
    const product = await Menu.findByPk(product_id);
    if (!product) {
      return res.status(404).json({ message: "المنتج غير موجود" });
    }

    const exists = await Favorite.findOne({
      where: { user_id: userId, menu_id:product_id },
    });

    if (exists) {
      return res.status(400).json({ message: "المنتج موجود بالفعل في المفضلة" });
    }

    const favorite = await Favorite.create({
      user_id:userId,
      menu_id:product_id,
    });

    res.status(201).json({
      success: true,
      message: "تمت الإضافة إلى المفضلة",
      data: favorite,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "خطأ في السيرفر" });
  }
};
exports.getFavorites = async (req, res) => {
  const userId = req.user.id;
  try {
    const favorites = await Favorite.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Menu,
          as:"menu"
        },
      ],
    });
    
    return res.json(favorites);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "خطأ في السيرفر" });
  }
};
exports.deleteFavorite = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params; // favorite id

  try {
    const deleted = await Favorite.destroy({
      where: { id, user_id: userId },
    });

    if (!deleted) {
      return res.status(404).json({ message: "العنصر غير موجود" });
    }

    res.json({
      success: true,
      message: "تم الحذف من المفضلة",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "خطأ في السيرفر" });
  }
};

exports.fetchRestaurantDetails = async (req, res) => {
  const { vendorId } = req.params;

  try {
    const restaurant = await Vendor.findOne({
      where: {
        id: vendorId,
        active: true,
      },
      attributes: [
        "id",
        "name_ar",
        "name_en",
        "short_description",
        "image_url",
        "cover",
        "phone",
        "whatsapp",
        "open_time",
        "close_time",
        "is24Hours",
        "working_days",
        "pickup",
        "latitude",
        "longitude",
      ],
      include: [
        {
          model: Category,
          where: { is_active: true },
          required: false,
          attributes: ["id", "name"],
          include: [
            {
              model: Menu,
              where: { is_available: true },
              required: false,
              attributes: [
                "id",
                "name",
                "description",
                "image",
                "type",
                "price",
                "price_before_discount",
                "discount_percentage",
              ],
            },
          ],
        },
      ],
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "المطعم غير موجود",
      });
    }

    res.status(200).json({
      success: true,
      data: restaurant,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "خطأ في السيرفر",
    });
  }
};

// checkout
exports.checkout = async (req, res) => {
  const userId = req.user.id;

  try {
    // 1. جلب عناصر السلة
    const cartItems = await CartItem.findAll({
      where: { user_id: userId },
      include: [{ model: Menu }],
    });

    if (!cartItems.length) {
      return res.status(400).json({ message: "السلة فارغة" });
    }

    // 2. التأكد إن كل المنتجات من نفس المطعم
    const vendorId = cartItems[0].Menu.vendor_id;
    const invalidVendor = cartItems.some(
      (item) => item.Menu.vendor_id !== vendorId
    );

    if (invalidVendor) {
      return res.status(400).json({
        message: "لا يمكن الطلب من أكثر من مطعم في نفس الطلب",
      });
    }

    // 3. حساب الإجمالي
    let total = 0;
    cartItems.forEach((item) => {
      total += item.Menu.price * item.quantity;
    });

    // 4. إنشاء الطلب
    const order = await Order.create(
      {
        user_id: userId,
        vendor_id: vendorId,
        total,
        status: "pending",
      },
    );

    // 5. إنشاء عناصر الطلب
    const orderItems = cartItems.map((item) => ({
      order_id: order.id,
      menu_id: item.Menu.id,
      quantity: item.quantity,
      price: item.Menu.price,
    }));

    await OrderItem.bulkCreate(orderItems);

    // 6. تفريغ السلة
    await CartItem.destroy({
      where: { user_id: userId },
    });


    res.status(201).json({
      success: true,
      message: "تم إنشاء الطلب بنجاح",
      data: {
        order_id: order.id,
        total,
        items_count: orderItems.length,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "خطأ أثناء تنفيذ الطلب" });
  }
};
