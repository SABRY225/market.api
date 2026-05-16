const {
  Delivery,
  User,
  sequelize,
  Order,
  Notification,
  OrderItem,
  Customer,
  OrderRequest,
  Menu,
  Payment,
} = require("../models");
const jwt = require("jsonwebtoken");
exports.register = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      username,
      email,

      phone,
      whatsapp,
      dob,
      gender,

      vehicleType,
      vehicleColor,
      plateNumber,

      idExpiry,
      licenseExpiry,
      vehicleLicenseExpiry,

      latitude,
      longitude,
      operatingArea,
      workType,
      dailyHours,
      workingDays,
    } = req.body;

    // ========================
    // 1️⃣ Check existing user
    // ========================
    const exists = await User.findOne({ where: { email } });
    if (exists) {
      await transaction.rollback();
      return res.status(400).json({ message: "Email already exists" });
    }

    // ========================
    // 3️⃣ Create User
    // ========================
    const user = await User.create(
      {
        name: username,
        email,
        role: "delivery",
      },
      { transaction },
    );
    console.log(user);

    // ========================
    // 4️⃣ Create Delivery
    // ========================
    const delivery = await Delivery.create(
      {
        user_id: user.id,
        username,
        email,
        phone,
        whatsapp,
        dob,
        gender,

        vehicleType,
        vehicleColor,
        plateNumber,

        idExpiry,
        licenseExpiry,
        vehicleLicenseExpiry,

        latitude,
        longitude,
        operatingArea,
        workType,
        dailyHours,
        workingDays,

        accountStatus: "pending",
      },
      { transaction },
    );

    await transaction.commit();

    res.status(201).json({
      message: "Delivery registered successfully",
      user,
      delivery,
    });
  } catch (err) {
    await transaction.rollback();
    res.status(500).json({ error: err.message });
  }
};
exports.login = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({
      where: { email, role: "delivery" },
      include: [
        {
          model: Delivery,
          as: "delivery", // تأكد أن هذا الاسم يطابق الـ alias في ملف الموديلات
        },
      ],
    });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    const token = jwt.sign(
      { sub: user.delivery.id, stage: "pre-verify" },
      process.env.JWT_SECRET,
      { expiresIn: "10h" },
    );
    return res.json({
      token,
      user: { id: user.delivery.id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};
exports.get = async (req, res) => {
  try {
    const deliver = await Delivery.findByPk(req.params.deliveryId);
    if (!deliver) return res.status(404).json({ message: "Not found" });
    return res.json(deliver);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};
exports.all = async (req, res) => {
  try {
    const list = await Delivery.findAll({ order: [["created_at", "DESC"]] });
    return res.json(list);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.status = async (req, res) => {
  try {
    const delivery = await Delivery.findByPk(req.params.deliveryId, {
      attributes: ["id", "accountStatus", "online"],
    });

    if (!delivery)
      return res.status(404).json({ message: "Delivery not found" });

    res.json(delivery);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { accountStatus } = req.body;

    const allowedStatus = ["pending", "approved", "rejected", "suspended"];

    if (!allowedStatus.includes(accountStatus))
      return res.status(400).json({ message: "Invalid status" });

    const delivery = await Delivery.findByPk(req.params.deliveryId);

    if (!delivery)
      return res.status(404).json({ message: "Delivery not found" });

    delivery.accountStatus = accountStatus;
    await delivery.save();

    res.json({
      message: "Status updated successfully",
      delivery,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.updateLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    const delivery = await Delivery.findByPk(req.params.deliveryId);

    if (!delivery)
      return res.status(404).json({ message: "Delivery not found" });

    delivery.latitude = latitude;
    delivery.longitude = longitude;

    await delivery.save();

    res.json({ message: "Location updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateOnline = async (req, res) => {
  try {
    const { online } = req.body;

    const delivery = await Delivery.findByPk(req.params.deliveryId);

    if (!delivery)
      return res.status(404).json({ message: "Delivery not found" });

    delivery.online = online;
    await delivery.save();

    res.json({
      message: "Online status updated",
      online: delivery.online,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.notification = async (req, res) => {
  try {
    const { deliveryId } = req.params;

    const notifications = await Notification.findAll({
      where: { userId: deliveryId },
      order: [["created_at", "DESC"]],
    });

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.acceptOrder = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { requestId } = req.params;

    // 1️⃣ نجيب طلب الاسناد
    const orderRequest = await OrderRequest.findByPk(requestId, {
      transaction: t,
    });

    if (!orderRequest) {
      await t.rollback();
      return res.status(404).json({ message: "Request not found" });
    }

    const { order_id, delivery_id } = orderRequest;

    // 2️⃣ تحديث الطلب الأساسي
    await Order.update(
      {
        delivery_id: delivery_id,
        status: "shipped",
        delivery_status: "processing",
      },
      {
        where: { id: order_id },
        transaction: t,
      },
    );

    // 3️⃣ حذف كل الطلبات الخاصة بنفس الطلب (مش بس واحد)
    await OrderRequest.destroy({
      where: { order_id: order_id },
      transaction: t,
    });

    // 4️⃣ حفظ التغييرات
    await t.commit();

    res.json({
      message: "Order accepted successfully",
    });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ message: error.message });
  }
};

exports.getDeliveryOrders = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const requests = await OrderRequest.findAll({
      where: {
        delivery_id: deliveryId,
      },
      include: [
        {
          model: Order,
          as: "order",
          include: [
            {
              model: User,
              as: "user",
              include: {
                model: Customer,
                as: "customer",
              },
            },
            {
              model: Payment,
              as: "payment",
            },
            {
              model: OrderItem,
              as: "items",
              include: [
                {
                  model: Menu,
                  as: "Menu",
                },
              ],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    const response = requests.map((r) => {
      const order = r.order;
      const user = r.order.user;
      const payment = r.order.payment;
      const customer = r.order.user.customer;

      return {
        id: `${r.id}`,
        customer: `${user.name}`,
        phone: customer.phone,
        latitude: order.latitude,
        longitude: order.longitude,
        payment: payment.method,
        date: order.createdAt.toISOString().split("T")[0],
        deliveryTime: order.deliveryTime,
        deliveryFee: order.deliveryFee,
        items: order.items.map((i) => ({
          name: i.Menu.name,
          price: Number(i.price),
        })),

        total: Number(order.total),
      };
    });

    return res.status(500).json(response);
  } catch (err) {
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

exports.myordersActive = async (req, res) => {
  try {
    const { deliveryId } = req.params;

    // 1. جلب الطلبات النشطة مع البيانات المرتبطة
    const orders = await Order.findAll({
      where: {
        delivery_id: deliveryId,
        status: ["shipped"],
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
    console.error("Error in myordersActive:", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};
exports.myordersHistory = async (req, res) => {
  try {
    const { deliveryId } = req.params;

    // 1. جلب الطلبات المكتملة فقط لهذا المندوب
    const orders = await Order.findAll({
      where: {
        delivery_id: deliveryId,
        status: "delivered", // تأكد أن الحالة مطابقة لما في قاعدة بياناتك (مثل 'completed' أو 'delivered')
      },
      order: [["created_at", "DESC"]],
      include: [
        {
          model: User,
          as: "user",
          attributes: ["name"],
        },
        {
          model: OrderItem,
          as: "items",
          attributes: ["id"], // نحتاج فقط الـ id لحساب العدد itemsCount
        },
      ],
    });

    // 2. التحقق من وجود بيانات لتجنب أخطاء المعالجة
    if (!orders) {
      return res.json([]);
    }
 const totalCommission = orders.reduce((sum, item) => {
    const total = parseFloat(item.deliveryFee || 0);
    return sum + total;
  }, 0);
  const orderCount = orders.length
    // 3. تحويل البيانات (Mapping) لتطابق التصميم المطلوب
    const formattedHistory = orders.map((order) => {
      const totalAmount = parseFloat(order.total || 0);

     
      return {
        id: `ORD-${order.id + 9000}`, // تنسيق الـ ID المطلوب
        customer: order.user?.name || "عميل سابق",
        total: totalAmount.toFixed(3), // تنسيق 3 خانات عشرية (دينار كويتي)
        commission:parseFloat(order.deliveryFee || 0) ,
        date: new Date(order.createdAt).toLocaleDateString("ar-KW", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        // تنسيق الوقت: "08:30 PM"
        time: new Date(order.createdAt).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
        itemsCount: order.items ? order.items.length : 0
      };
    });

    return res.json({data:formattedHistory,totalCommission,orderCount});
  } catch (err) {
    console.error("Error in myordersHistory:", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

exports.getDeliveryStats = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    // 3. جلب آخر العمليات (Transactions)
    const recentOrders = await Order.findAll({
      where: { delivery_id: deliveryId },
      limit: 5,
      order: [["created_at", "DESC"]],
      attributes: ["id", "createdAt", "status", "total","deliveryFee"],
    });

    const transactions = recentOrders.map((order) => ({
      id: `#${order.id + 10000}`,
      time: new Date(order.createdAt).toDateString(),
      status:
        order.status === "delivered"
          ? "تم التسليم"
          : order.status === "cancelled"
            ? "ملغي"
            : "معلق",
      commission:
        order.status === "cancelled"
          ? "0"
          : (parseFloat(order.deliveryFee)).toString(),
    }));

    return res.json({  transactions });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.changeStatusOrder = async (req, res) => {
  try {
    const { status, dasc } = req.body;
    const { deliveryId } = req.params;
      const order = await Order.findOne({where: { delivery_id: deliveryId }});
    
    if (status == "success") {
      await Order.update(
        {
          status: "delivered",
          delivery_status: "delivered",
        },
        {
          where: { delivery_id: deliveryId },
        },
      );
      
      await Payment.update(
        {
          status: "paid"
        },
        {
          where: {order_id: order.id },
        },
      );
    } else {
      const order = await Order.update(
        {
          delivery_id: delivery_id,
          status: "cancelled",
          delivery_status: "delivered",
        },
        {
          where: { id: order_id },
        },
      );
      await Payment.update(
        {
          status: "faild"
        },
        {
          where: {order_id: order.id },
        },
      );
    }
    return res.status(200).json({
      message: "Order Changing successfully",
    });
  } catch (error) {
     res.status(500).json({ message: error.message });
  }
};


// 1. جلب بيانات الملف الشخصي
exports.getProfile = async (req, res) => {
  try {
    const userId = req.params.userId; // أو جلبها من الـ Token (req.user.id)
    const delivery = await Delivery.findByPk(userId);

    if (!delivery) {
      return res.status(404).json({ message: "لم يتم العثور على الملف الشخصي" });
    }

    res.status(200).json(delivery);
  } catch (error) {
    res.status(500).json({ message: "خطأ في السيرفر", error: error.message });
  }
};

// 2. تحديث بيانات الملف الشخصي
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.params.userId;
    const updateData = req.body;

    // منع تحديث الحقول الحساسة مباشرة إذا لزم الأمر
    delete updateData.id;
    delete updateData.user_id;

    const [updated] = await Delivery.update(updateData, {
      where: { id: userId }
    });

    if (updated) {
      const updatedProfile = await Delivery.findOne({ where: { id: userId } });
      return res.status(200).json({
        message: "تم التحديث بنجاح",
        data: updatedProfile
      });
    }

    throw new Error("لم يتم التحديث، قد يكون الملف غير موجود");
  } catch (error) {
    res.status(500).json({ message: "حدث خطأ أثناء التحديث", error: error.message });
  }
};