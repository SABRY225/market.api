const { default: axios } = require('axios');
const { ProductMart } = require('../../models'); // تأكد من صحة مسار الموديلات لديك
const fs = require('fs');
const path = require('path');

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

function generateFileName(file) {
  const mimeType = file.mimetype || 'image/jpeg';
  const ext = (mimeType.split('/')[1] || 'jpg').replace(/[^a-z0-9]/gi, '');
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
}

exports.createProduct = async (req, res) => {
  try {
    const { name, price,description , stock } = req.body;

    if (!name || !price || !description || stock === undefined) {
      return res.status(400).json({
        success: false,
        message: 'برجاء إدخال جميع الحقول الأساسية (الاسم، السعر، الوصف ،المخزون)'
      });
    }

    // 2. تجهيز رابط الصورة (إن وجدت)
    let imageUrl = null;
    
      if (req.file) {
      imageUrl = await uploadBufferToBunny(
        req.file.buffer,
        generateFileName(req.file),
        req.file.mimetype
      );
    }

    const newProduct = await ProductMart.create({
      name,
      description,
      price: parseFloat(price),
      stock: parseInt(stock),
      imageUrl
    });

    return res.status(201).json({
      success: true,
      message: 'تم إضافة المنتج بنجاح بالمستودع',
      data: newProduct
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إضافة المنتج بالسيرفر',
      error: error.message
    });
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    const products = await ProductMart.findAll({
      order: [['created_at', 'DESC']] // عرض الأحدث أولاً
    });

    return res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب المنتجات',
      error: error.message
    });
  }
};


exports.getProductById = async (req, res) => {
  try {
    const product = await ProductMart.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'المنتج غير موجود'
      });
    }

    return res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب تفاصيل المنتج',
      error: error.message
    });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await ProductMart.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'المنتج المستهدف غير موجود'
      });
    }

    const { name, price, stock ,description} = req.body;
    let imageUrl = product.imageUrl; // الاحتفاظ بالصورة القديمة كافتراضي

    // إذا تم رفع صورة جديدة
    if (req.file) {
      imageUrl = await uploadBufferToBunny(
        req.file.buffer,
        generateFileName(req.file),
        req.file.mimetype
      );
    }

    // تحديث البيانات في قاعدة البيانات
    await product.update({
      name: name || product.name,
      description: description || product.description,
      price: price ? parseFloat(price) : product.price,
      stock: stock !== undefined ? parseInt(stock) : product.stock,
      imageUrl
    });

    return res.status(200).json({
      success: true,
      message: 'تم تحديث بيانات المنتج بنجاح',
      data: product
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث المنتج',
      error: error.message
    });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await ProductMart.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'المنتج غير موجود بالفعل'
      });
    }

    // الحذف من قاعدة البيانات
    await product.destroy();

    return res.status(200).json({
      success: true,
      message: 'تم حذف المنتج وصورته نهائياً من المنظومة'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف المنتج',
      error: error.message
    });
  }
};