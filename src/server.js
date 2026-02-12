require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize, syncDatabase } = require('./models');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// API v1 mounts
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/admin', require('./routes/admin'));
app.use('/api/v1/user', require('./routes/user'));
app.use('/api/v1/vendor', require('./routes/vendor'));
app.use('/api/v1/order', require('./routes/order'));
app.use('/api/v1/payment', require('./routes/payment'));
app.use('/api/v1/coupon', require('./routes/coupon'));
app.use('/api/v1/analytics', require('./routes/analytics'));
app.use('/api/v1/dispute', require('./routes/dispute'));
app.use('/api/v1/client', require('./routes/client'));
app.use('/api/v1/delivery', require('./routes/delivery'));
app.use('/api/v1/review', require('./routes/review'));
app.use("/api/v1/tickets", require("./routes/sellerTickets"));
app.use("/api/v1/reports", require("./routes/sellerReports"));
app.use("/api/v1/menu", require("./routes/menu"));

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const PORT = Number(process.env.PORT) || 4000;

const startServer = async () => {
  try {
    // Sync database (set to true to drop and recreate tables)
    await syncDatabase(false);
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
