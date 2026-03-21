module.exports = (sequelize, DataTypes) => {
  const Menu = sequelize.define(
    "Menu",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },

      image: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
     calories: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      deliveryTime: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      is_available: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      vendor_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      category_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      
    // نوع المنتج
    type: {
      type: DataTypes.ENUM('normal', 'offer'),
      allowNull: false,
      defaultValue: 'normal',
    },

    // السعر الأساسي
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
    },

    // سعر قبل الخصم (يظهر فقط لو عرض)
    price_before_discount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },

    // نسبة الخصم %
    discount_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    },
    {
      tableName: "menus",
      timestamps: true, // createdAt & updatedAt
      underscored: true, // created_at بدل createdAt
      
    hooks: {
      beforeSave: (product) => {
        // لو المنتج عرض نحسب السعر النهائي تلقائيًا
        if (product.type === 'offer') {
          if (
            product.price_before_discount &&
            product.discount_percentage
          ) {
            product.price =
              product.price_before_discount -
              (product.price_before_discount * product.discount_percentage / 100);
          }
        }
      }
    }
    }
  );

  return Menu;
};
