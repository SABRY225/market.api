module.exports = (sequelize, DataTypes) => {
  const Delivery = sequelize.define(
    "delivery",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },

      username: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },

      email: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },

      phone: {
        type: DataTypes.STRING(20),
        unique: true,
      },
      whatsapp: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },

      dob: {
        type: DataTypes.DATEONLY, // أفضل من STRING
        allowNull: true,
      },
      documentsVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      rating: {
        type: DataTypes.DECIMAL(2, 1),
        defaultValue: 5.0,
      },
      lastSeen: {
        type: DataTypes.DATE,
      },
      gender: {
        type: DataTypes.ENUM("male", "female"),
        allowNull: true,
      },

      vehicleType: {
        type: DataTypes.ENUM("bike", "motorcycle", "car"),
        allowNull: false,
      },

      vehicleColor: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },

      plateNumber: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },

      idExpiry: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },

      licenseExpiry: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },

      vehicleLicenseExpiry: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },

      latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: true,
      },

      longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true,
      },

      operatingArea: {
        type: DataTypes.STRING(150), // مثال: "Nasr City"
        allowNull: true,
      },

      workType: {
        type: DataTypes.ENUM("full_time", "part_time"),
        allowNull: false,
        defaultValue: "full_time",
      },

      dailyHours: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      workingDays: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
      },
      
      online: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      is_busy:{
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      accountStatus: {
        type: DataTypes.ENUM("pending", "approved", "rejected", "suspended"),
        allowNull: false,
        defaultValue: "approved",
      },
    },
    {
      tableName: "deliveries",
      timestamps: true,
      underscored: true,
    },
  );

  
  return Delivery;
};
