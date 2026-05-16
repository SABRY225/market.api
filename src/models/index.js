const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Customer = require('./customer')(sequelize, DataTypes);
const Menu = require('./menu')(sequelize, DataTypes);
const Ticket = require('./ticket')(sequelize, DataTypes);
const Category = require('./category')(sequelize, DataTypes);
const User = require('./user')(sequelize, DataTypes);
const Vendor = require('./vendor')(sequelize, DataTypes);
const Delivery = require('./delivery')(sequelize, DataTypes);
const Order = require('./order')(sequelize, DataTypes);
const Payment = require('./payment')(sequelize, DataTypes);
const Coupon = require('./coupon')(sequelize, DataTypes);
const Dispute = require('./dispute')(sequelize, DataTypes);
const Review = require('./review')(sequelize, DataTypes);
const SupportTicket = require('./support_ticket')(sequelize, DataTypes);
const CartItem = require('./cart_item')(sequelize, DataTypes);
const Favorite = require('./favorite')(sequelize, DataTypes);
const VendorWithdrawal = require('./vendor_withdrawal')(sequelize, DataTypes);
const Notification = require('./notification')(sequelize, DataTypes);
const OrderItem = require('./OrderItem')(sequelize, DataTypes);
const OrderRequest = require('./orderRequest')(sequelize, DataTypes);
const ChatMessage = require('./ChatMessage')(sequelize, DataTypes);
const Advertisement = require('./advertisement')(sequelize, DataTypes);
const ProductMart = require('./mart/productMart')(sequelize, DataTypes);
const OrderMart = require('./mart/ordersMart')(sequelize, DataTypes);
const OrderItemMart = require('./mart/OrderItemMart')(sequelize, DataTypes);
const Reward = require('./rewards/reward')(sequelize, DataTypes);
const InvitationSystem = require('./invitation_system')(sequelize, DataTypes);
const DeliverSystem = require('./delivery_system')(sequelize, DataTypes);
// Associations (add here later if needed)

// Notification <> User
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' ,onDelete: "CASCADE"});
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });

// Order <> User
Order.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(Order, { foreignKey: 'user_id', as: 'orders' });

Order.belongsTo(Vendor, { foreignKey: 'vendor_id', as: 'vendor' });
Vendor.hasMany(Order, { foreignKey: 'vendor_id', as: 'orders' });
// Order <> Delivery
Order.belongsTo(Delivery, { foreignKey: 'delivery_id', as: 'delivery' });
Delivery.hasMany(Order, { foreignKey: 'delivery_id', as: 'deliver_orders' });


// Coupon <> User (vendor)
Coupon.belongsTo(User, { foreignKey: 'vendor_id', as: 'vendor' });
User.hasMany(Coupon, { foreignKey: 'vendor_id', as: 'coupons' });



// VendorWithdrawal <> User
VendorWithdrawal.belongsTo(User, { foreignKey: 'vendor_id', as: 'vendor' });
User.hasMany(VendorWithdrawal, { foreignKey: 'vendor_id', as: 'withdrawals' });

// OrderItem <> Menu
OrderItem.belongsTo(Menu, { foreignKey: 'menu_id', as: 'Menu' });
Menu.hasMany(OrderItem, { foreignKey: 'menu_id', as: 'orderItems' });

// OrderItem <> Order
OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });

Order.hasOne(Payment, { as: "payment", foreignKey: "order_id" });
Payment.belongsTo(Order, { foreignKey: "order_id" });

OrderRequest.belongsTo(Order, {
    foreignKey: "order_id",
    as: "order"
});

User.hasOne(Vendor, { foreignKey: 'user_id', as: 'vendor', onDelete: 'CASCADE'});
Vendor.belongsTo(User, { foreignKey: 'user_id', as: 'user'});

User.hasOne(Delivery, { foreignKey: 'user_id', as: 'delivery', onDelete: 'CASCADE'});
Delivery.belongsTo(User, { foreignKey: 'user_id',  as: 'user'});

Menu.belongsTo(Category, { foreignKey: "category_id",  as: "category"});
Category.hasMany(Menu, { foreignKey: "category_id", as: "menus" });

Category.belongsTo(Vendor, {foreignKey: "vendor_id",as: "vendor"});
Vendor.hasMany(Category, { foreignKey: "vendor_id", as: "categories"});

Vendor.hasMany(Menu, {foreignKey: "vendor_id",as: "menus"});
Menu.belongsTo(Vendor, { foreignKey: "vendor_id", as: "vendor" });

Review.belongsTo(User, { foreignKey: "user_id", as: "user"});

Menu.hasMany(Review, { foreignKey: 'menu_id', as: 'reviews' });
Review.belongsTo(Menu, { foreignKey: 'menu_id', as: 'menu' });

User.hasOne(Customer, { foreignKey: 'user_id', as: 'customer', onDelete: 'CASCADE' });
Customer.belongsTo(User, { foreignKey: 'user_id' ,as: 'user' });

// User ↔ CartItem
User.hasMany(CartItem, {foreignKey: "user_id",as: "user",onDelete: "CASCADE",});
CartItem.belongsTo(User, {foreignKey: "user_id",as: "user"});

// CartItem ↔ Menu
Menu.hasMany(CartItem, {foreignKey: "menu_id",as: "cart_items",onDelete: "CASCADE",});
CartItem.belongsTo(Menu, {foreignKey: "menu_id",as: "menu"});

User.hasMany(Favorite, { foreignKey: "user_id",as: "favorite", onDelete: "CASCADE" });
Favorite.belongsTo(User, { foreignKey: "user_id",as: "user" });

Menu.hasMany(Favorite, { foreignKey: "menu_id",as:"menu", onDelete: "CASCADE" });
Favorite.belongsTo(Menu, { foreignKey: "menu_id",as:"menu" });

ChatMessage.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
Order.hasMany(ChatMessage, { foreignKey: 'order_id', as: 'messages' });

const syncDatabase = async (force = true, alter = false) => {
  try {
    await sequelize.sync({ force, alter });
    console.log('✅ Database synced successfully');
  } catch (error) {
    console.error('❌ Error syncing database:', error);
  }
};

module.exports = {
  syncDatabase,
  sequelize,
  User,
  Vendor,
  Delivery,
  Ticket,
  Order,
  Payment,
  Coupon,
  Category,
  ChatMessage,
  OrderRequest,
  Menu,
  Dispute,
  Review,
  SupportTicket,
  CartItem,
  DeliverSystem,
  Favorite,
  Customer,
  VendorWithdrawal,
  OrderItem,
  InvitationSystem,
  Reward,
  Notification,
  Advertisement,
  OrderItemMart,
  ProductMart,
  OrderMart
};
