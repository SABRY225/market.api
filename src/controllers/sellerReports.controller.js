// controllers/sellerReportsController.js
const { Order, OrderItem, Menu } = require("../models");
const { Op, fn, literal, col } = require("sequelize");

exports.getReports = async (req, res) => {
  try {
    const vendorId = req.user.sub;
    const period = req.query.period || "daily";

    const now = new Date();
    let startDate;

    if (period === "monthly") {
      startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    } else {
      startDate = new Date(now.setDate(now.getDate() - 6));
    }

    // 1️⃣ إجمالي الأرباح
    const totalProfit = await Order.sum("total", {
      where: {
        vendor_id: vendorId,
        status: "completed",
        created_at: { [Op.gte]: startDate },
      },
    });

    // 2️⃣ نسبة الإرجاع
    const totalOrders = await Order.count({
      where: { vendor_id: vendorId },
    });

    const returnedOrders = await Order.count({
      where: {
        vendor_id: vendorId,
        status: "returned",
      },
    });

    const returnsRate =
      totalOrders === 0
        ? "0%"
        : `${Math.round((returnedOrders / totalOrders) * 100)}%`;

    // 3️⃣ بيانات الرسم البياني
    const chartRaw = await Order.findAll({
      attributes: [
        [fn("DATE", col("created_at")), "date"],
        [fn("SUM",col("total")), "value"],
      ],
      where: {
        vendor_id: vendorId,
        status: "completed",
        created_at: { [Op.gte]: startDate },
      },
      group: ["date"],
      order: [["date", "ASC"]],
      raw: true,
    });

    const chartData = chartRaw.map((r) => ({
      name: r.date,
      value: Number(r.value),
    }));

    // 4️⃣ أكثر المنتجات مبيعًا
    const topProducts = await OrderItem.findAll({
      attributes: [
        "menu_id",
        [fn("SUM", col("quantity")), "sales"],
      ],
      include: [
        {
          model: Menu,
           as: 'Menu',
          attributes: ["name"],
          where: { vendor_id: vendorId },
        },
      ],
      group: ["menu.id"],
      order: [[literal("sales"), "DESC"]],
      limit: 4,
      raw: true,
    });

    return res.json({
      chartData,
      topProducts: topProducts.map((p) => ({
        name: p["Menu.name"],
        sales: p.sales,
      })),
      summary: {
        totalProfit: totalProfit || 0,
        returnsRate,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load reports" });
  }
};
