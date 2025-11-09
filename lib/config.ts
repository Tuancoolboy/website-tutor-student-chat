/**
 * Application Configuration
 * Centralized configuration for the backend API
 */

export const config = {
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'tutor-support-system-secret-key-2025',
    expiresIn: '7d',
    refreshExpiresIn: '30d'
  },

  // Vercel Blob Storage
  blob: {
    token: process.env.BLOB_READ_WRITE_TOKEN || '',
    enabled: !!process.env.BLOB_READ_WRITE_TOKEN
  },

  // WebSocket Configuration
  websocket: {
    url: process.env.WEBSOCKET_URL || 'ws://localhost:3001'
  },

  // Frontend Configuration
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:5173'
  },

  // API Configuration
  api: {
    port: parseInt(process.env.API_PORT || '3000'),
    basePath: '/api'
  },

  // Environment
  env: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV !== 'production',
  isProduction: process.env.NODE_ENV === 'production',

  // Pagination Defaults
  pagination: {
    defaultPage: 1,
    defaultLimit: 10,
    maxLimit: 100
  },

  // Session Configuration
  session: {
    minDuration: 30, // minutes
    maxDuration: 180, // minutes
    reminderTime: 60 // minutes before session
  },

  // Upload Configuration
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'application/pdf', 'video/mp4']
  }
};

export default config;

