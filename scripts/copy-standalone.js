const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '..', '.next', 'standalone');
const targetDir = path.join(__dirname, '..', 'standalone');
const staticSource = path.join(__dirname, '..', '.next', 'static');
const staticTarget = path.join(__dirname, '..', 'standalone', '.next', 'static');
const publicSource = path.join(__dirname, '..', 'public');
const publicTarget = path.join(__dirname, '..', 'standalone', 'public');

function copyRecursiveSync(src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();

    if (isDirectory) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        fs.readdirSync(src).forEach(function (childItemName) {
            copyRecursiveSync(
                path.join(src, childItemName),
                path.join(dest, childItemName)
            );
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

console.log('Copying standalone build...');

// Remove existing standalone folder
if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
}

// Copy standalone folder
copyRecursiveSync(sourceDir, targetDir);
console.log('Copied standalone build');

// Copy static files
copyRecursiveSync(staticSource, staticTarget);
console.log('Copied static files');

// Copy public folder
copyRecursiveSync(publicSource, publicTarget);
console.log('Copied public folder');

// Copy .env file if exists
const envSource = path.join(__dirname, '..', '.env');
const envTarget = path.join(__dirname, '..', 'standalone', '.env');
if (fs.existsSync(envSource)) {
    fs.copyFileSync(envSource, envTarget);
    console.log('Copied .env file');
}

console.log('Build preparation complete!');
