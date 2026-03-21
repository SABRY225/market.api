
module.exports = (sequelize, DataTypes) => {
  const OrderRequest = sequelize.define('OrderRequest', {
        id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Orders', // اسم جدول الطلبات الأساسي
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    delivery_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Deliveries', // اسم جدول الديليفري
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    status: {
        type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'expired'),
        defaultValue: 'pending',
        comment: 'حالة العرض بالنسبة لهذا المندوب'
    },
    distance_at_assign: {
        type: DataTypes.FLOAT,
        comment: 'المسافة التي كانت بين المندوب والمطعم وقت الإرسال'
    }
}, {
    tableName: 'order_requests',
    timestamps: true // لتعرف متى تم إرسال الطلب (createdAt)
});

  return OrderRequest;
};
