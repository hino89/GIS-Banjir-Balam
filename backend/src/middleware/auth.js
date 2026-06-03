const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token tidak ditemukan' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Token tidak valid atau kadaluarsa' });
  }
};

const adminOnly = (req, res, next) => {
  if (!req.user || !['SUPERADMIN', 'ADMIN'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Akses ditolak. Hanya admin yang diizinkan.' });
  }
  next();
};

const superAdminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'SUPERADMIN') {
    return res.status(403).json({ success: false, message: 'Akses ditolak. Hanya superadmin yang diizinkan.' });
  }
  next();
};

module.exports = { authMiddleware, adminOnly, superAdminOnly };
