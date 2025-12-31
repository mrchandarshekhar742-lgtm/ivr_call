const { spawn, exec } = require('child_process');
const path = require('path');
const net = require('net');

console.log('🚀 Starting IVR System...\n');

// Function to check if a port is open
function checkPort(port, host = 'localhost') {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    
    socket.setTimeout(3000);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    
    socket.on('error', () => {
      resolve(false);
    });
    
    socket.connect(port, host);
  });
}

// Function to start a service
function startService(command, args, cwd, name) {
  return new Promise((resolve, reject) => {
    console.log(`📡 Starting ${name}...`);
    
    const service = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: true
    });
    
    service.on('error', (err) => {
      console.error(`❌ ${name} error:`, err);
      reject(err);
    });
    
    // Give the service time to start
    setTimeout(() => {
      resolve(service);
    }, 2000);
  });
}

async function main() {
  try {
    // Check if MySQL is running
    console.log('🔍 Checking MySQL connection...');
    const mysqlRunning = await checkPort(3306);
    
    if (!mysqlRunning) {
      console.log('⚠️  MySQL is not running on port 3306');
      console.log('💡 Please start MySQL first:');
      console.log('   - Windows: Start MySQL service or run mysqld.exe');
      console.log('   - macOS: brew services start mysql');
      console.log('   - Linux: sudo systemctl start mysql');
      console.log('');
    } else {
      console.log('✅ MySQL is running');
    }
    
    // Check if Redis is running
    console.log('🔍 Checking Redis connection...');
    const redisRunning = await checkPort(6379);
    
    if (!redisRunning) {
      console.log('⚠️  Redis is not running on port 6379');
      console.log('💡 Please start Redis first:');
      console.log('   - Windows: Start Redis service or run redis-server.exe');
      console.log('   - macOS: brew services start redis');
      console.log('   - Linux: sudo systemctl start redis');
      console.log('');
    } else {
      console.log('✅ Redis is running');
    }
    
    if (!mysqlRunning) {
      console.log('❌ MySQL is required. Please start MySQL and try again.');
      process.exit(1);
    }
    
    if (!redisRunning) {
      console.log('⚠️  Continuing without Redis (some features may be limited)');
    }
    
    // Seed database if needed
    console.log('🌱 Seeding database...');
    await new Promise((resolve, reject) => {
      exec('npm run seed', { cwd: path.join(__dirname, 'backend') }, (error, stdout, stderr) => {
        if (error && !error.message.includes('already exist')) {
          console.error('Seeding error:', error);
          reject(error);
        } else {
          console.log('✅ Database seeded');
          resolve();
        }
      });
    });
    
    // Start backend
    const backend = await startService('npm', ['run', 'dev'], path.join(__dirname, 'backend'), 'Backend Server');
    
    // Wait for backend to be ready
    console.log('⏳ Waiting for backend to be ready...');
    let backendReady = false;
    let attempts = 0;
    
    while (!backendReady && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      backendReady = await checkPort(5000);
      attempts++;
    }
    
    if (!backendReady) {
      console.error('❌ Backend failed to start');
      process.exit(1);
    }
    
    console.log('✅ Backend is ready');
    
    // Start frontend
    const frontend = await startService('npm', ['run', 'dev'], path.join(__dirname, 'frontend'), 'Frontend Server');
    
    // Wait for frontend to be ready
    console.log('⏳ Waiting for frontend to be ready...');
    let frontendReady = false;
    attempts = 0;
    
    while (!frontendReady && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      frontendReady = await checkPort(3000);
      attempts++;
    }
    
    if (!frontendReady) {
      console.error('❌ Frontend failed to start');
      process.exit(1);
    }
    
    console.log('✅ Frontend is ready');
    console.log('\n🎉 IVR System is now running!');
    console.log('📱 Frontend: http://localhost:3000');
    console.log('🔧 Backend API: http://localhost:5000');
    console.log('👤 Admin Login: admin@ivrSystem.com / admin123');
    console.log('\n💡 Press Ctrl+C to stop all services');
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down IVR System...');
      backend.kill();
      frontend.kill();
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      console.log('\n🛑 Shutting down IVR System...');
      backend.kill();
      frontend.kill();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Failed to start IVR System:', error);
    process.exit(1);
  }
}

main();