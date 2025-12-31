#!/usr/bin/env node

/**
 * IVR Call Management System - Production Startup Script
 * Starts both backend and frontend servers for production deployment
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting IVR Call Management System - Production Mode');
console.log('================================================');

// Check if production environment files exist
const backendEnv = path.join(__dirname, 'backend', '.env');
const frontendEnv = path.join(__dirname, 'frontend', '.env.production');

if (!fs.existsSync(backendEnv)) {
  console.log('⚠️  Backend .env file not found. Please copy .env.example to .env and configure.');
  process.exit(1);
}

// Start Backend Server (Production)
console.log('🔧 Starting Backend Server (Production)...');
const backendProcess = spawn('npm', ['run', 'prod'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, NODE_ENV: 'production' }
});

// Wait for backend to start
setTimeout(() => {
  // Start Frontend Server (Production)
  console.log('🎨 Starting Frontend Server (Production)...');
  const frontendProcess = spawn('npm', ['run', 'start'], {
    cwd: path.join(__dirname, 'frontend'),
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, NODE_ENV: 'production' }
  });

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down IVR System...');
    
    backendProcess.kill('SIGINT');
    frontendProcess.kill('SIGINT');
    
    setTimeout(() => {
      console.log('✅ IVR System stopped successfully');
      process.exit(0);
    }, 2000);
  });

  frontendProcess.on('error', (error) => {
    console.error('❌ Frontend process error:', error);
  });

  frontendProcess.on('exit', (code) => {
    if (code !== 0) {
      console.error(`❌ Frontend process exited with code ${code}`);
    }
  });

}, 5000);

// Handle backend process errors
backendProcess.on('error', (error) => {
  console.error('❌ Backend process error:', error);
});

backendProcess.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Backend process exited with code ${code}`);
  }
});

console.log('');
console.log('🎯 Production System Information:');
console.log('================================');
console.log('📊 Backend API: http://localhost:5000');
console.log('🌐 Frontend Dashboard: http://localhost:3000');
console.log('📱 WebSocket Server: ws://localhost:8080');
console.log('🔐 Admin Login: admin@ivrSystem.com / admin123');
console.log('');
console.log('📚 Production Features:');
console.log('- ✅ Optimized performance');
console.log('- ✅ Enhanced security');
console.log('- ✅ Production logging');
console.log('- ✅ Error monitoring');
console.log('- ✅ Auto-restart capability');
console.log('');
console.log('🔧 For PM2 deployment: npm run pm2:start');
console.log('🐳 For Docker deployment: docker-compose up -d');
console.log('');
console.log('Press Ctrl+C to stop the system');
console.log('================================================');