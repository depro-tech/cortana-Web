import { exec } from 'child_process';
import { promisify } from 'util';
import { rm, mkdir, copyFile, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

const execAsync = promisify(exec);

async function runCommand(command) {
  console.log(`Running: ${command}`);
  try {
    const { stdout, stderr } = await execAsync(command);
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    return true;
  } catch (error) {
    console.error(`Command failed: ${command}`);
    console.error(error.message);
    if (error.stderr) console.error(error.stderr);
    return false;
  }
}

async function copyDir(src, dest) {
  if (!existsSync(src)) return;
  
  await mkdir(dest, { recursive: true });
  const entries = await readdir(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await copyFile(srcPath, destPath);
    }
  }
}

async function build() {
  console.log('Starting build process...');
  
  // Clean dist directory
  console.log('Cleaning dist directory...');
  await rm('dist', { recursive: true, force: true });
  
  // Build client with Vite
  console.log('Building client...');
  const clientBuilt = await runCommand('npx vite build');
  if (!clientBuilt) {
    console.error('Client build failed');
    process.exit(1);
  }
  
  // Create simple production server
  console.log('Creating production server...');
  const serverCode = `import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const time = new Date().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
    console.log(\`\${time} [express] \${req.method} \${req.path} \${res.statusCode} in \${duration}ms\`);
  });
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ message });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(\`Server running on port \${PORT} in \${process.env.NODE_ENV || 'production'} mode\`);
});`;
  
  // Create dist directory structure
  await mkdir('dist/public', { recursive: true });
  
  // Write server file
  const fs = await import('fs');
  fs.writeFileSync('dist/server.js', serverCode);
  
  console.log('Build completed successfully!');
}

build().catch(error => {
  console.error('Build failed with error:', error);
  process.exit(1);
});
