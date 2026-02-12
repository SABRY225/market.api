const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const https = require('https');
const { User, Vendor } = require('../models');
const { hashPassword, comparePassword } = require('../utils/password');
const { default: axios } = require('axios');
const { log } = require('console');

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
  return `${Date.now()}_${Math.random().toString(36).slice(2,8)}.${ext}`;
}

// دالة التسجيل
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, role } = req.body;

  try {
    // التحقق من وجود المستخدم مسبقًا
    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(409).json({ message: 'Email already in use' });

    let user;
    if (role === 'customer') {
      const { name, password } = req.body;
      const passwordHash = await hashPassword(password);
      user = await User.create({ name, email, passwordHash, role });
    } else {
      // إنشاء المستخدم للبائع
      const { name_en } = req.body;
      user = await User.create({ name: name_en, email, role });
    }

    let createdVendor = null;

    // إذا كان الدور vendor، نتعامل مع بيانات البائع والملفات
    if (role === 'vendor') {
      const vendorData = { ...req.body, user_id: user.id };

      // رفع الملفات إذا موجودة
      if (req.files) {
        try {
          // رفع logo
          if (req.files.logo && req.files.logo[0]) {
            vendorData.image_url = await uploadBufferToBunny(
              req.files.logo[0].buffer,
              generateFileName(req.files.logo[0]),
              req.files.logo[0].mimetype
            );
          }

          // رفع cover
          if (req.files.cover && req.files.cover[0]) {
            vendorData.cover = await uploadBufferToBunny(
              req.files.cover[0].buffer,
              generateFileName(req.files.cover[0]),
              req.files.cover[0].mimetype
            );
          }
        } catch (e) {
          console.error('Bunny upload error', e);
        }
      }
     vendorData.working_days= typeof req.body.working_days === 'string' ? JSON.parse(req.body.working_days) : req.body.working_days;
      createdVendor = await Vendor.create(vendorData);
    }

    return res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      vendor: createdVendor,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await comparePassword(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });
    return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.updateVendorProfile = async (req, res) => {
  try {
    // التأكد إن المستخدم Vendor
    const vendor = await Vendor.findOne({ where: { user_id: req.params.id } });
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    const updatedData = { ...req.body };

    // 🔁 parsing working_days لو جاية string
    if (updatedData.working_days) {
      updatedData.working_days =
        typeof updatedData.working_days === 'string'
          ? JSON.parse(updatedData.working_days)
          : updatedData.working_days;
    }

    // 📤 رفع الصور (اختياري)
    if (req.files) {
      try {
        // logo
        if (req.files.logo && req.files.logo[0]) {
          updatedData.image_url = await uploadBufferToBunny(
            req.files.logo[0].buffer,
            generateFileName(req.files.logo[0]),
            req.files.logo[0].mimetype
          );
        }

        // cover
        if (req.files.cover && req.files.cover[0]) {
          updatedData.cover = await uploadBufferToBunny(
            req.files.cover[0].buffer,
            generateFileName(req.files.cover[0]),
            req.files.cover[0].mimetype
          );
        }
      } catch (e) {
        console.error('Bunny upload error', e);
        return res.status(500).json({ message: 'Image upload failed' });
      }
    }

    // ❌ منع تعديل user_id
    delete updatedData.user_id;

    // ✅ التحديث
    await vendor.update(updatedData);

    return res.json({
      message: 'Vendor profile updated successfully',
      vendor,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};
