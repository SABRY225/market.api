
const { User, Order, sequelize, OrderItem, Payment, Menu } = require('../models');
const { Op, fn, col, literal } = require('sequelize');
exports.statistics = async (req, res) => {
  try {
    // 1️⃣ عدد المستخدمين
    const usersCount = await User.count();

    // 2️⃣ تاريخ بداية ونهاية الشهر الحالي
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setMilliseconds(-1); // آخر ثانية من الشهر

    // 3️⃣ إجمالي المبيعات وعدد الطلبات الشهر الحالي
    const monthlySales = await Order.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('total')), 'totalSales'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'ordersCount']
      ],
      where: {
        status: 'delivered', // الطلبات الناجحة فقط
        created_at: { [Op.between]: [startOfMonth, endOfMonth] }
      },
      raw: true
    });

    const totalSales = parseFloat(monthlySales[0].totalSales) || 0;
    const ordersCount = parseInt(monthlySales[0].ordersCount) || 0;

    // 4️⃣ منتجات
    const productsStats = await Menu.findAll({
  attributes: [
    [fn('COUNT', col('id')), 'totalProducts'],

    [
      fn(
        'SUM',
        literal('CASE WHEN is_available = 0 THEN 1 ELSE 0 END')
      ),
      'outOfStock'
    ],

    [
      fn(
        'SUM',
        literal('CASE WHEN is_available = 1 THEN 1 ELSE 0 END')
      ),
      'available'
    ],
  ],
  where: { is_available: 1 },
  raw: true,
});


    const { totalProducts, outOfStock, lowStock } = productsStats[0];

    return res.json({
      usersCount,
      totalSales,
      ordersCount,
      products: {
        totalProducts: totalProducts ? parseInt(totalProducts) : 0,
        outOfStock: outOfStock ? parseInt(outOfStock) : 0,
        lowStock: lowStock ? parseInt(lowStock) : 0
      }
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};


exports.monthlySales = async (req, res) => {
  try {
    // 1️⃣ أسماء الشهور بالعربي
    const months = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];

    // 2️⃣ جلب المبيعات من DB
    const rows = await Order.findAll({
      attributes: [
        [fn('MONTH', col('created_at')), 'month'],
        [fn('SUM', col('total')), 'sales']
      ],
      group: [fn('MONTH', col('created_at'))],
      raw: true
    });

    // 3️⃣ تحويل النتيجة إلى Map
    const salesMap = {};
    rows.forEach(r => {
      salesMap[r.month] = Number(r.sales);
    });

    // 4️⃣ تجهيز الريسبونس الافتراضي
    const response = months.map((name, index) => ({
      month: name,
      sales: salesMap[index + 1] || 0
    }));

    return res.json(response);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};



exports.activeUsers = async (req, res) => {
  try {
    // 1️⃣ أيام الأسبوع بالعربي (نفس الترتيب اللي هيرجع في الشارت)
    const days = [
      'السبت',
      'الأحد',
      'الإثنين',
      'الثلاثاء',
      'الأربعاء',
      'الخميس',
      'الجمعة'
    ];

    // 2️⃣ جلب عدد المستخدمين حسب يوم الأسبوع (آخر 30 يوم)
    const rows = await User.findAll({
      attributes: [
        [fn('DAYOFWEEK', col('created_at')), 'day'],
        [fn('COUNT', col('id')), 'active']
      ],
      where: {
        created_at: {
          [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      group: [fn('DAYOFWEEK', col('created_at'))],
      raw: true
    });

    // 3️⃣ تحويل النتائج إلى Map
    const map = {};
    rows.forEach(r => {
      // MySQL: 1=Sunday ... 7=Saturday
      const index = r.day === 7 ? 0 : r.day;
      map[index] = Number(r.active);
    });

    // 4️⃣ تجهيز الريسبونس النهائي (حتى لو مفيش داتا)
    const response = days.map((name, index) => ({
      day: name,
      active: map[index] || 0
    }));

    return res.json(response);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};



exports.mostSoldProducts = async (req, res) => {
  try {
    const rows = await OrderItem.findAll({
      attributes: [
        [col('Menu.name'), 'name'],
        [fn('SUM', col('OrderItem.quantity')), 'sales']
      ],
        include: [
          {
            model: Menu,
            as: 'Menu',
            attributes: []
          },
          {
            model: Order,
            as: 'order',
            attributes: [],
            where: { status: 'delivered' }
          }
        ],
      group: ['Menu.id'],
      order: [[literal('sales'), 'DESC']],
      limit: 5,
      raw: true
    });

    // لو مفيش مبيعات
    if (!rows.length) {
      return res.json([]);
    }

    return res.json(
      rows.map(r => ({
        image: r.imageUrl,
        name: r.name,
        sales: Number(r.sales || 0)
      }))
    );

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};


exports.platformMonthlyProfits = async (req, res) => {
  try {
    const rows = await Payment.findAll({
      attributes: [[fn('strftime', '%Y-%m', col('created_at')), 'month'], [fn('sum', col('amount')), 'total']],
      group: [fn('strftime', '%Y-%m', col('created_at'))],
      order: [[col('month'), 'DESC']],
      limit: 12,
    });
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};
