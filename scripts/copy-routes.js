const fs = require('fs');
const path = require('path');

// Source and destination directories
const srcDir = path.resolve(__dirname, '../src/routes');
const destDir = path.resolve(__dirname, '../dist/routes');

// Create destination directory if it doesn't exist
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Copy all route files
const files = fs.readdirSync(srcDir);
for (const file of files) {
  if (file.endsWith('.routes.ts')) {
    const srcPath = path.join(srcDir, file);
    const destPath = path.join(destDir, file);
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied ${srcPath} to ${destPath}`);
  }
}

console.log('Route files copied successfully!');
