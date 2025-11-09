/**
 * Environment detection and API configuration
 */

// For Vercel, check if we're on a production domain
const isProduction = typeof window !== 'undefined' 
  ? window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
  : false;

// Get environment variables (Vite uses import.meta.env)
// @ts-ignore - Vite provides import.meta.env
const getEnvVar = (key: string): string | undefined => {
  if (typeof window !== 'undefined' && (window as any).import?.meta?.env) {
    return (window as any).import.meta.env[key];
  }
  // @ts-ignore - Vite provides import.meta.env
  return import.meta.env?.[key];
};

// API Base URL
// On Vercel, API runs on same domain as frontend (/api)
// On local, API runs on separate server (localhost:3000/api)
export const API_BASE_URL = 
  getEnvVar('VITE_API_URL') || 
  (isProduction 
    ? '/api'  // Vercel: API on same domain
    : 'http://localhost:3000/api'  // Local: API on separate server
  );

// WebSocket URL
// WebSocket MUST run on separate server (Render/Railway)
// Vercel does NOT support WebSocket
export const WEBSOCKET_URL = 
  getEnvVar('VITE_WEBSOCKET_URL') ||
  (isProduction
    ? 'https://website-tutor-student-1.onrender.com'  // Render WebSocket URL
    : 'http://localhost:3001'  // Local WebSocket server
  );

