const jwt = require('jsonwebtoken');
const { logger } = require('../config/logger');

// Mock user data (same as in auth-mock.js)
const mockUsers = [
  {
    id: 1,
    email: 'admin@ivrSystem.com',
    name: 'Admin User',
    role: 'admin',
    status: 'active',
    permissions: [
      'create_campaign', 'edit_campaign', 'delete_campaign', 'view_campaigns', 
      'manage_users', 'view_analytics', 'manage_audio', 'manage_contacts', 
      'view_call_logs', 'manage_settings', 'manage_devices'
    ]
  },
  {
    id: 2,
    email: 'manager@ivrSystem.com',
    name: 'Manager User',
    role: 'manager',
    status: 'active',
    permissions: [
      'create_campaign', 'edit_campaign', 'view_campaigns', 'view_analytics',
      'manage_audio', 'manage_contacts', 'view_call_logs', 'manage_devices'
    ]
  }
];

// Verify JWT token (mock)
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    const user = mockUsers.find(u => u.id === decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token - user not found'
      });
    }

    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Account is not active'
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    logger.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

// Check if user has required permission (mock)
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!req.user.permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        required: permission,
        userPermissions: req.user.permissions
      });
    }

    next();
  };
};

// Check if user has any of the required roles (mock)
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient role privileges',
        required: allowedRoles,
        userRole: req.user.role
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  requirePermission,
  requireRole
};