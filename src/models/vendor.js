module.exports = (sequelize, DataTypes) => {
  const Vendor = sequelize.define('Vendor', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
    name_ar: { type: DataTypes.STRING(150), allowNull: true },
    name_en: { type: DataTypes.STRING(150), allowNull: true },
    short_description: { type: DataTypes.TEXT, allowNull: true },
    type: { type: DataTypes.STRING(100), allowNull: true },
    status: { type: DataTypes.STRING(50), allowNull: true },
    phone: { type: DataTypes.STRING(50), allowNull: true },
    whatsapp: { type: DataTypes.STRING(50), allowNull: true },
    email: { type: DataTypes.STRING(150), allowNull: true, unique: true, validate: { isEmail: true } },
    image_url: { type: DataTypes.STRING(500), allowNull: true },
    cover: { type: DataTypes.STRING(500), allowNull: true },
    owner: { type: DataTypes.STRING(150), allowNull: true },
    country: { type: DataTypes.STRING(100), allowNull: true },
    city: { type: DataTypes.STRING(100), allowNull: true },
    area: { type: DataTypes.STRING(100), allowNull: true },
    address: { type: DataTypes.STRING(255), allowNull: true },
    latitude: { type: DataTypes.DECIMAL(10, 6), allowNull: true, defaultValue: 30.0444 },
    longitude: { type: DataTypes.DECIMAL(10, 6), allowNull: true, defaultValue: 31.2357 },
    pickup: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    open_time: { type: DataTypes.STRING(20), allowNull: true },
    close_time: { type: DataTypes.STRING(20), allowNull: true },
    is24Hours: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    working_days: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  }, {
    tableName: 'vendors',
    timestamps: true,
    underscored: true,
  });

  return Vendor;
};
