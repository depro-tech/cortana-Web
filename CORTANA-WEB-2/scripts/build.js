import { exec } from 'child_process';
import { promisify } from 'util';
import { rm, cp, mkdir } from 'fs/promises';
import { existsSync } from 'fs';

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

async function build() {
  console.log('Starting build process...');
  
  // Clean dist directory
  console.log('Cleaning dist directory...');
  await rm('dist', { recursive: true, force: true });
  await mkdir('dist', { recursive: true });
  
  // Build client with Vite
  console.log('Building client...');
  const clientBuilt = await runCommand('npx vite build');
  if (!clientBuilt) {
    console.error('Client build failed');
    process.exit(1);
  }
  
  // Copy server source files
  console.log('Copying server files...');
  await cp('server', 'dist/server', { recursive: true });
  
  // Copy shared files
  if (existsSync('shared')) {
    console.log('Copying shared files...');
    await cp('shared', 'dist/shared', { recursive: true });
  }
  
  console.log('Build completed successfully!');
}

build().catch(error => {
  console.error('Build failed with error:', error);
  process.exit(1);
});
