const { Order, OrderItem, Payment, Menu, Customer, User, Delivery, OrderRequest } = require("../models");

exports.all = async (req, res) => {
  try {
    const orders = await Order.findAll({
      // 1. اختيار الحقول المطلوبة فقط وتغيير أسمائها
      attributes: [
        'id',
        'total', // نفترض أن الحقل في الداتابيز هو total_price
        ['created_at', 'date'],   // نفترض أن الحقل في الداتابيز هو created_at
        'status'
      ],
      // 2. دمج جدول المستخدم لجلب اسم العميل
      include: [
        {
          model: User,
          as: 'user', // يجب أن يطابق الـ 'as' الموجود في التعريف belongsTo
          attributes: ['name'] // نأخذ الاسم فقط
        }
      ],
      order: [["created_at", "DESC"]]
    });

    // 3. تحويل البيانات لشكل Flat (مسطح) لتطابق طلبك تماماً
    const formattedOrders = orders.map(order => {
      return {
        id: order.id,
        customer: order.user ? order.user.name : "عميل مجهول",
        total: order.get('total'), // نستخدم get لجلب الـ Alias
        date: order.get('date'),
        status: order.status
      };
    });

    return res.json(formattedOrders);
  } catch (err) {
    console.error("Error fetching orders:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
exports.getOrdersVendor = async (req, res) => {
  try {
    const vendorId = req.user.sub;

    const orders = await Order.findAll({
      where: { vendor_id: vendorId },
      order: [["created_at", "DESC"]],
    });

    // Optional: Return a 404 or specific message if no orders exist
    if (!orders || orders.length === 0) {
      return res.status(200).json({ message: "No orders found for this vendor.", data: [] });
    }

    return res.status(200).json(orders);
  } catch (err) {
    console.error("Error fetching vendor orders:", err);
    return res.status(500).json({ message: "An internal server error occurred." });
  }
};


exports.getOrderDetails = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.orderId, {
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [
            {
              model: Menu, 
              as: "Menu",  // تأكد من أن هذا هو نفس الـ alias المعرف في العلاقات (Associations)
              attributes: ['id', 'name', 'image', 'description'] // حدد الحقول التي تريدها فقط
            }
          ]
        },
        { 
          model: Payment, 
          as: "payment" 
        },
        { 
          model: User, 
          as: "user",
          include: [
            {
              model: Customer, 
              as: "customer", 
            }
          ]
        }
      ]
    });

    if (!order) {
      return res.status(404).json({ message: "الطلب غير موجود" });
    }

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByPk(req.params.orderId);

    if (!order) return res.status(404).json({ message: "الطلب غير موجود" });

    order.status = status; 
    await order.save();

    res.status(200).json({ message: "تم تحديث الحالة بنجاح", order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.assignDelivery = async (req, res) => {
    try {
        const { orderId } = req.params;

        // 1. جلب الطلب مع بيانات المطعم (المورد)
        const order = await Order.findByPk(orderId, { include: ['vendor'] });
        if (!order) return res.status(404).json({ message: "الطلب غير موجود" });

        const restaurantLat = order.vendor.latitude;
        const restaurantLng = order.vendor.longitude;
        
        
        // 2. جلب كل الديليفري المتاحين (الغير مشغولين) والنشطين
        const allDrivers = await Delivery.findAll({
            where: { 
                is_busy: false,
                online: true // تأكد من جلب المتصلين فقط
            }
        });

        if (allDrivers.length === 0) {
            return res.status(404).json({ message: "لا يوجد مناديب متاحين حالياً" });
        }

        // 3. تصفية الديليفري حسب الموقع (ما بين 5 كم إلى 15 كم)
        // دالة مساعدة لحساب المسافة بالكيلومتر
        const calculateDistance = (lat1, lon1, lat2, lon2) => {
            const R = 6371; // نصف قطر الأرض بالكيلومتر
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a = 
                Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            return R * c; 
        };

        const filteredDrivers = allDrivers.filter(driver => {
            const distance = calculateDistance(
                restaurantLat, 
                restaurantLng, 
                driver.latitude, 
                driver.longitude
            );
            console.log(distance);
            // الشرط: المسافة بين 5 و 15 كم
            return distance >= 0 && distance <= 15;
        });

        if (filteredDrivers.length === 0) {
            return res.status(404).json({ message: "لا يوجد مناديب في النطاق الجغرافي المطلوب (5-15 كم)" });
        }

        // رتبهم من الأقرب للأبعد داخل المصفوفة المصفاة
        filteredDrivers.sort((a, b) => {
            const distA = calculateDistance(restaurantLat, restaurantLng, a.latitude, a.longitude);
            const distB = calculateDistance(restaurantLat, restaurantLng, b.latitude, b.longitude);
            return distA - distB;
        });

        // 4. إرسال الطلب إليهم وتخزينه في جدول مؤقت (مثلاً جدول OrderRequests)
        // نقوم بإنشاء سجل لكل مندوب تم ترشيحه ليظهر له في التطبيق
        const orderRequests = filteredDrivers.map(driver => ({
            order_id: order.id,
            delivery_id: driver.id,
            status: 'pending'
        }));
        
        // استخدام BulkCreate للتخزين الجماعي في الجدول المؤقت
        await OrderRequest.bulkCreate(orderRequests);

        // 5. تحديث الطلب الأساسي
        // نضع حالة الطلب "searching" ونربطه بأول مندوب (الأقرب) كمرشح أولي
        await order.update({
            delivery_status: 'pending',
            status: 'searching'
        });

        // 6. إرسال التنبيهات (Push Notifications) لكل المناديب المصفين
        // filteredDrivers.forEach(driver => {
        //     if (driver.fcm_token) {
        //         sendPushNotification(
        //             driver.fcm_token, 
        //             "طلب جديد في منطقتك", 
        //             `يوجد طلب يبعد عنك مسافة مناسبة، اضغط للتفاصيل`
        //         );
        //     }
        // });

        res.json({ 
            success: true, 
            message: `تم إرسال الطلب لـ ${filteredDrivers.length} مندوب في النطاق المطلوب`,
            drivers_count: filteredDrivers.length 
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "حدث خطأ في الخادم" });
    }
};