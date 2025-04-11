#!/usr/bin/env node

/**
 * This script forces a refresh of the Swagger documentation by touching the route files
 * to trigger nodemon to restart the server.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const routesDir = path.join(__dirname, 'src', 'routes');

console.log('Refreshing Swagger documentation...');

// Touch all route files to trigger nodemon restart
fs.readdirSync(routesDir).forEach(file => {
  if (file.endsWith('.routes.ts')) {
    const filePath = path.join(routesDir, file);
    const stats = fs.statSync(filePath);
    
    // Update the file's modification time
    fs.utimesSync(filePath, stats.atime, new Date());
    console.log(`Touched ${file}`);
  }
});

// Restart the server if it's running
try {
  console.log('Attempting to restart the server...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('Build complete. Swagger documentation should be refreshed.');
  console.log('Please restart your server if it\'s not running with: npm run dev');
} catch (error) {
  console.error('Error building the project:', error.message);
}
