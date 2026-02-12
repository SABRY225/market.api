// controllers/menuController.js
const { default: axios } = require('axios');
const { User, Category, Menu, Review, OrderItem, Vendor } = require('../models');
const { fn, col, literal } = require('sequelize');

async function uploadBufferToBunny(buffer, filename, mime = 'image/jpeg') {
  const storageZone = process.env.BUNNY_STORAGE_ZONE;
  const apiKey = process.env.BUNNY_API_KEY;

  if (!storageZone || !apiKey) throw new Error('BunnyCDN config missing');

  const response = await axios.put(
    `https://storage.bunnycdn.com/${storageZone}/${filename}`,
    buffer,
    {
      headers: {
        'AccessKey': apiKey,
        'Content-Type': mime,
      },
    }
  );

  if (response.status === 201 || response.status === 200) {
    return `https://${storageZone}.b-cdn.net/${filename}`;
  } else {
    throw new Error('Upload failed');
  }
}

// دالة مساعدة لتوليد اسم ملف فريد
function generateFileName(file) {
  const mimeType = file.mimetype || 'image/jpeg';
  const ext = (mimeType.split('/')[1] || 'jpg').replace(/[^a-z0-9]/gi, '');
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
}


// 1. جلب كافة التصنيفات مع الأصناف التابعة لها
exports.getCategories = async (req, res) => {
  try {
    const vendorId = req.user.sub;

    const categories = await Category.findAll({
      where: { vendor_id: vendorId },
      include: [
        {
          model: Menu,
          as: "menus",
        },
      ],
      order: [["id", "ASC"]],
    });

    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "حدث خطأ أثناء جلب التصنيفات" });
  }
};

// 2. إضافة صنف جديد للمنيو
exports.addMenuItem = async (req, res) => {
  try {
    const vendorId = req.user.sub;
    const { name, price, description, category_id, type, price_before_discount
      , discount_percentage, is_available } = req.body;

    // التحقق من وجود البيانات الأساسية
    if (!name || !type || !category_id) {
      return res.status(400).json({ message: "يرجى إكمال البيانات المطلوبة" });
    }
    let image;

    if (req.file) {
      image = await uploadBufferToBunny(
        req.file.buffer,
        generateFileName(req.file),
        req.file.mimetype
      );
    }
    const item = await Menu.create({
      name,
      price,
      price_before_discount,
      discount_percentage,
      description,
      type,
      is_available,
      category_id,
      vendor_id: vendorId,
      image: req.file ? image : null,
    });

    res.status(201).json(item);
  } catch (error) {
    console.error("Error adding menu item:", error);
    res.status(500).json({ message: "فشل في إضافة الصنف" });
  }
};

// 3. تحديث صنف موجود
exports.updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.user.sub;

    // التأكد من أن الصنف ينتمي لهذا البائع قبل التحديث
    const item = await Menu.findOne({ where: { id, vendor_id: vendorId } });
    if (!item) {
      return res.status(404).json({ message: "الصنف غير موجود أو لا تملك صلاحية تعديله" });
    }

    const updateData = {
      name: req.body.name,
      price: req.body.price,
      description: req.body.description,
      type: req.body.type,
      is_available: req.body.is_available,
      discount_percentage: req.body.discount_percentage,
      price_before_discount: req.body.price_before_discount,
    };

    // تحديث الصورة فقط إذا تم رفع ملف جديد
    if (req.file) {
      updateData.image = await uploadBufferToBunny(
        req.file.buffer,
        generateFileName(req.file),
        req.file.mimetype
      );;
    }

    await item.update(updateData);

    res.json({ message: "تم تحديث الصنف بنجاح", item });
  } catch (error) {
    console.error("Error updating menu item:", error);
    res.status(500).json({ message: "حدث خطأ أثناء تحديث الصنف" });
  }
};

// 4. حذف صنف
exports.deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.user.sub;

    const deleted = await Menu.destroy({
      where: { id, vendor_id: vendorId }
    });

    if (!deleted) {
      return res.status(404).json({ message: "الصنف غير موجود" });
    }

    res.json({ message: "تم حذف الصنف بنجاح" });
  } catch (error) {
    console.error("Error deleting menu item:", error);
    res.status(500).json({ message: "فشل في حذف الصنف" });
  }
};

// 5. إضافة تصنيف جديد (قسم)
exports.addCategory = async (req, res) => {
  try {
    const vendorId = req.user.sub;
    const { name } = req.body;
    console.log(req.user);

    if (!name) {
      return res.status(400).json({ message: "اسم التصنيف مطلوب" });
    }

    const category = await Category.create({
      name,
      vendor_id: vendorId,
    });

    res.status(201).json(category);
  } catch (error) {
    console.error("Error adding category:", error);
    res.status(500).json({ message: "فشل في إضافة القسم الجديد" });
  }
};


exports.topProducts = async (req, res) => {
  try {
    const products = await Menu.findAll({ limit: 4 });
    return res.json(products);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.topProductAndOffers = async (req, res) => {
  try {
    let topProductsOffer = await Menu.findAll({
      attributes: [
        ...buildProductAttributes(req.user?.id),
        [fn('SUM', col('orderItems.quantity')), 'total_sold'],
      ],
      include: [
        {
          model: OrderItem,
          as: 'orderItems',
          attributes: [],
        },
      ],
      where: {
        type: 'offer',
        is_available: true,
      },
      group: ['Menu.id'],
      order: [[literal('total_sold'), 'DESC']],
      limit: 4,
      subQuery: false,
    });

    let topProducts = await Menu.findAll({
      attributes: [
        ...buildProductAttributes(req.user?.id),
        [fn('SUM', col('orderItems.quantity')), 'total_sold'],
      ],
      include: [
        {
          model: OrderItem,
          as: 'orderItems',
          attributes: [],
        },
      ],
      where: {
        type: 'normal',
        is_available: true,
      },
      group: ['Menu.id'],
      order: [[literal('total_sold'), 'DESC']],
      limit: 4,
      subQuery: false,
    });


    const reviews = await Review.findAll({
      include: [
        {
          model: User,
          as: 'user',
        },
      ],
      where:{status:"approved"},
      order: [['created_at', 'DESC']],
      limit: 4,
    });

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

    if (!topProducts.some(p => Number(p.get('total_sold')) > 0)) {
      topProducts = await Menu.findAll({
        attributes: buildProductAttributes(req.user?.id),
        where: { type: 'normal', is_available: true },
        order: [['created_at', 'DESC']],
        limit: 8,
      });

      topProductsOffer = await Menu.findAll({
        attributes: buildProductAttributes(req.user?.id),
        where: { type: 'offer', is_available: true },
        order: [['created_at', 'DESC']],
        limit: 8,
      });
    }
    return res.json({ topProducts, topProductsOffer, reviews, restaurants });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.fetchOffers = async (req, res) => {
  try {
    let productsOffer = await Menu.findAll({
      attributes: [
        ...buildProductAttributes(req.user?.id),
        [fn('SUM', col('orderItems.quantity')), 'total_sold'],
      ],
      include: [
        {
          model: OrderItem,
          as: 'orderItems',
          attributes: [],
        },
      ],
      where: {
        type: 'offer',
        is_available: true,
      },
      group: ['Menu.id'],
      order: [[literal('total_sold'), 'DESC']],
      limit: 4,
      subQuery: false,
    });

    return res.json(productsOffer);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.fetchProducts = async (req, res) => {
  try {
    let productsProducts = await Menu.findAll({
      attributes: [
        ...buildProductAttributes(req.user?.id),
        [fn('SUM', col('orderItems.quantity')), 'total_sold'],
      ],
      include: [
        {
          model: OrderItem,
          as: 'orderItems',
          attributes: [],
        },
      ],
      where: {
        type: 'normal',
        is_available: true,
      },
      group: ['Menu.id'],
      order: [[literal('total_sold'), 'DESC']],
      limit: 4,
      subQuery: false,
    });

    return res.json(productsProducts);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.fetchProductDetails = async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Menu.findOne({
      where: {
        id,
        type: "normal",
      },
    });

    if (!product) {
      return res.status(404).json({
        message: "المنتج غير موجود",
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "خطأ في السيرفر",
    });
  }
};

exports.fetchOfferDetails = async (req, res) => {
  const { id } = req.params;

  try {
    const offer = await Menu.findOne({
      where: {
        id,
        type: "offer",
      },
      attributes: [
        "id",
        "name",
        "description",
        "image",
        "price",
        "price_before_discount",
        "discount_percentage",
        "is_available",
        "vendor_id",
        "category_id",
      ],
    });

    if (!offer) {
      return res.status(404).json({
        message: "العرض غير موجود",
      });
    }

    res.status(200).json({
      success: true,
      data: offer,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "خطأ في السيرفر",
    });
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

const buildProductAttributes = (userId = null) => ([
  'id',
  'type',
  ['name', 'name'],
  ['image', 'image'],
  ['price', 'price'],

  // ⭐ متوسط التقييم
  [
    literal(`(
      SELECT COALESCE(AVG(r.rating), 0)
      FROM reviews r
      WHERE r.menu_id = Menu.id
        AND r.status = 'approved'
    )`),
    'rating'
  ],

  // 📝 عدد التقييمات
  [
    literal(`(
      SELECT COUNT(*)
      FROM reviews r
      WHERE r.menu_id = Menu.id
        AND r.status = 'approved'
    )`),
    'reviewCount'
  ],

  // ❤️ isFavorite (لو معندكش favorites خليها false)
  [
    userId
      ? literal(`(
          SELECT COUNT(*)
          FROM favorites f
          WHERE f.menu_id = Menu.id
            AND f.user_id = ${userId}
        )`)
      : literal('0'),
    'isFavorite'
  ],
]);
