const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    // 1️⃣ التوكن (من body أو headers لو حابب)
    const token =
      req.body.token ||
      req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        message: 'Token is required'
      });
    }

    // 2️⃣ Verify Token
    const payload = jwt.verify(token, process.env.JWT_SECRET);


    // 4️⃣ Attach payload to request
    req.user = payload;

    next();
  } catch (error) {
    return res.status(401).json({
      message: 'Invalid or expired token'
    });
  }
};
