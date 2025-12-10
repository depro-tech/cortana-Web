import { exec } from 'child_process';
import { promisify } from 'util';
import { rm, mkdir, copyFile, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
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

async function copyNonTsFiles(srcDir, destDir) {
  if (!existsSync(srcDir)) return;
  
  if (!existsSync(destDir)) {
    await mkdir(destDir, { recursive: true });
  }
  
  const files = await readdir(srcDir);
  for (const file of files) {
    const srcPath = join(srcDir, file);
    const destPath = join(destDir, file);
    
    // Skip TypeScript files and certain directories
    if (file.endsWith('.ts') && !file.endsWith('.d.ts')) continue;
    if (file === 'node_modules' || file === 'dist') continue;
    
    const stat = await import('fs').then(fs => fs.promises.stat(srcPath));
    if (stat.isDirectory()) {
      await copyNonTsFiles(srcPath, destPath);
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
  
  // Create dist directory structure
  await mkdir('dist/public', { recursive: true });
  await mkdir('dist/server', { recursive: true });
  
  // Copy client build to dist/public
  console.log('Copying client files...');
  if (existsSync('client/dist')) {
    await copyNonTsFiles('client/dist', 'dist/public');
  }
  
  // Build server using esbuild (simpler, no complex tsconfig)
  console.log('Building server with esbuild...');
  const esbuildCommand = `
    npx esbuild server/index.ts \
      --bundle \
      --platform=node \
      --target=node20 \
      --format=esm \
      --outfile=dist/server/index.js \
      --external:express \
      --external:pg \
      --external:drizzle-orm \
      --external:drizzle-zod \
      --external:zod \
      --external:express-session \
      --external:passport \
      --external:passport-local \
      --external:connect-pg-simple \
      --external:memorystore \
      --external:ws \
      --external:axios \
      --external:pino \
      --external:date-fns \
      --minify \
      --sourcemap
  `;
  
  const serverBuilt = await runCommand(esbuildCommand);
  if (!serverBuilt) {
    console.error('Server build failed');
    process.exit(1);
  }
  
  // Copy shared files
  console.log('Copying shared files...');
  await copyNonTsFiles('shared', 'dist/shared');
  
  // Copy package.json to dist for production
  console.log('Creating production package.json...');
  const packageJson = JSON.parse(await import('fs').then(fs => 
    fs.promises.readFile('package.json', 'utf-8')
  ));
  
  // Create minimal package.json for production
  const productionPackage = {
    name: packageJson.name,
    version: packageJson.version,
    type: packageJson.type,
    main: 'server/index.js',
    dependencies: {
      'express': packageJson.dependencies.express,
      'pg': packageJson.dependencies.pg,
      'drizzle-orm': packageJson.dependencies['drizzle-orm'],
      'drizzle-zod': packageJson.dependencies['drizzle-zod'],
      'zod': packageJson.dependencies.zod,
      'express-session': packageJson.dependencies['express-session'],
      'passport': packageJson.dependencies.passport,
      'passport-local': packageJson.dependencies['passport-local'],
      'connect-pg-simple': packageJson.dependencies['connect-pg-simple'],
      'memorystore': packageJson.dependencies.memorystore,
      'ws': packageJson.dependencies.ws,
      'axios': packageJson.dependencies.axios,
      'pino': packageJson.dependencies.pino,
      'date-fns': packageJson.dependencies['date-fns']
    }
  };
  
  await import('fs').then(fs => 
    fs.promises.writeFile(
      'dist/package.json',
      JSON.stringify(productionPackage, null, 2)
    )
  );
  
  console.log('Build completed successfully!');
  console.log('Output structure:');
  console.log('  dist/public/     - Client files');
  console.log('  dist/server/     - Server files');
  console.log('  dist/shared/     - Shared files');
  console.log('  dist/package.json - Production dependencies');
}

build().catch(error => {
  console.error('Build failed with error:', error);
  process.exit(1);
});
