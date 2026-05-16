const { ProductMart, OrderMart, sequelize, OrderItemMart } = require("../../models");

const OrderMartController = {
  // 1. Get all orders with their associated products
  async getAllOrders(req, res) {
    try {
      // 1. جلب جميع الطلبات الأساسية أولاً دون أي علاقات
      const orders = await OrderMart.findAll();

      // 2. جلب جميع العناصر الموجودة في الجدول الوسيط (الكميات والروابط)
      const orderItems = await OrderItemMart.findAll();

      // 3. جلب جميع المنتجات لمعرفة تفاصيلها (الاسم، السعر، إلخ)
      const products = await ProductMart.findAll();

      // 4. دمج البيانات يدوياً بـ JavaScript بدلاً من الـ include
      const mappedOrders = orders.map(order => {
        // تحويل الموديل إلى كائن JSON عادي لتعديله بسهولة
        const orderJson = order.toJSON();

        // الفلترة للوصول إلى المنتجات التابعة لهذا الطلب فقط من الجدول الوسيط
        const currentOrderItems = orderItems.filter(item => item.order_id === order.id);

        // بناء مصفوفة المنتجات لهذا الطلب
        orderJson.productsMart = currentOrderItems.map(item => {
          // البحث عن بيانات المنتج نفسه بواسطة الـ product_id
          const productInfo = products.find(p => p.id === item.product_id);
          
          if (!productInfo) return null;

          return {
            ...productInfo.toJSON(),
            OrderItemMart: {
              quantity: item.quantity // إرفاق الكمية
            }
          };
        }).filter(p => p !== null); // إزالة أي منتجات غير موجودة بالخطأ

        return orderJson;
      });

      // 5. إرجاع البيانات مدمجة وجاهزة
      return res.status(200).json({ success: true, data: mappedOrders });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  // 2. Get single order by ID
  async getOrderById(req, res) {
    try {
      const order = await OrderMart.findByPk(req.params.id, {
        include: [{
          model: ProductMart,
          as: 'productsMart',
          through: { attributes: ['quantity'] }
        }]
      });

      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
      return res.status(200).json({ success: true, data: order });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  // 3. Create a new Order (Calculates total price based on product prices)
  async createOrder(req, res) {
    const transaction = await sequelize.transaction();
    try {
      const { customer, products } = req.body; 
      // Expected payload format: 
      // { "customer": "John Doe", "products": [{ "id": 1, "quantity": 2 }, { "id": 2, "quantity": 1 }] }

      if (!customer || !products || !products.length) {
        return res.status(400).json({ success: false, message: 'Customer and structural product list required.' });
      }

      let calculatedTotalPrice = 0;
      const verifiedProducts = [];

      // Loop through items to verify stock, fetch prices and compute the real total price
      for (const item of products) {
        const dbProduct = await ProductMart.findByPk(item.id, { transaction });
        if (!dbProduct) {
          await transaction.rollback();
          return res.status(404).json({ success: false, message: `Product ID ${item.id} not found.` });
        }

        // Optional: Check stock capacity if your 'stack' field implies inventory stock
        if (dbProduct.stack < item.quantity) {
          await transaction.rollback();
          return res.status(400).json({ success: false, message: `Insufficient stock for product: ${dbProduct.name}` });
        }

        calculatedTotalPrice += parseFloat(dbProduct.price) * item.quantity;
        verifiedProducts.push({ dbProduct, quantity: item.quantity });
      }

      // Create the core order block
      const newOrder = await OrderMart.create({
        customer,
        totalPrice: calculatedTotalPrice,
        status: 'Pending'
      }, { transaction });

      // Link order to products using your custom junction table options 
      for (const item of verifiedProducts) {
        // Option A: If using built-in Sequelize methods
        await newOrder.addProductsMart(item.dbProduct, { 
          through: { quantity: item.quantity }, 
          transaction 
        });

        // Deduct inventory/stock pool 
        await item.dbProduct.update({
          stack: item.dbProduct.stack - item.quantity
        }, { transaction });
      }

      await transaction.commit();
      return res.status(201).json({ success: true, data: newOrder });

    } catch (error) {
      await transaction.rollback();
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  // 4. Update Order Status or Delivery Man
  async updateOrder(req, res) {
    try {
      const { id } = req.params;
      const { status, deliveryMan } = req.body;

      const order = await OrderMart.findByPk(id);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      // Update parameters conditionally if provided
      if (status) order.status = status;
      if (deliveryMan) order.deliveryMan = deliveryMan;

      await order.save();
      return res.status(200).json({ success: true, message: 'Order updated successfully', data: order });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  // 5. Delete/Cancel Order
  async deleteOrder(req, res) {
    try {
      const order = await OrderMart.findByPk(req.params.id);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
      
      await order.destroy();
      return res.status(200).json({ success: true, message: 'Order dropped completely' });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
};

module.exports = OrderMartController;