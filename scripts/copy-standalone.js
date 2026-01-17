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

// Rebuild native modules for Electron
console.log('Rebuilding native modules for Electron...');
const { execSync } = require('child_process');

try {
    // 1. Get Electron Version
    console.log('Detecting Electron version...');
    // We run electron --version from the local node_modules
    const electronVersionOutput = execSync('npx electron --version', {
        cwd: path.join(__dirname, '..'),
        encoding: 'utf8'
    }).trim();

    // Output format is usually "v1.2.3", remove 'v' if present
    const electronVersion = electronVersionOutput.replace(/^v/, '');
    console.log(`Target Electron version: ${electronVersion}`);

    // 2. Rebuild
    // We need to run this from the project root, targeting the standalone directory
    const electronRebuildCmd = `npx @electron/rebuild --module-dir "${targetDir}" --version ${electronVersion} --force --only better-sqlite3`;
    console.log(`Running: ${electronRebuildCmd}`);

    execSync(electronRebuildCmd, {
        cwd: path.join(__dirname, '..'), // Run from root where electron devDep is
        stdio: 'inherit'
    });
    console.log('Native modules rebuilt successfully.');
} catch (error) {
    console.error('Failed to rebuild native modules:', error);
    process.exit(1);
}
