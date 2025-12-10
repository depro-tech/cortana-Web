import { build as viteBuild } from "vite";
import { exec } from "child_process";
import { promisify } from "util";
import { rm, copyFile, readdir, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";

const execAsync = promisify(exec);

async function buildAll() {
  // Clean dist directory
  await rm("dist", { recursive: true, force: true });

  console.log("Building client...");
  await viteBuild();

  console.log("Building server...");
  
  // Create tsconfig for server compilation
  const tsconfig = {
    extends: "./tsconfig.json",
    compilerOptions: {
      "module": "ESNext",
      "moduleResolution": "bundler",
      "target": "ES2022",
      "outDir": "dist",
      "rootDir": ".",
      "allowSyntheticDefaultImports": true,
      "esModuleInterop": true,
      "skipLibCheck": true,
      "noEmit": false,
      "sourceMap": true,
      "declaration": false
    },
    "include": ["server/**/*", "shared/**/*"],
    "exclude": ["node_modules", "client/**/*", "dist"]
  };

  // Write temporary tsconfig
  const fs = await import("fs");
  fs.writeFileSync("tsconfig.build.json", JSON.stringify(tsconfig, null, 2));

  try {
    // Compile TypeScript
    await execAsync("npx tsc --project tsconfig.build.json");
    
    // Clean up temporary tsconfig
    fs.unlinkSync("tsconfig.build.json");
    
    // Copy any non-TypeScript files from server directory
    if (existsSync("server")) {
      await copyNonTsFiles("server", "dist/server");
    }
    
    // Copy shared files
    if (existsSync("shared")) {
      await copyNonTsFiles("shared", "dist/shared");
    }
    
    console.log("Build completed successfully!");
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
}

async function copyNonTsFiles(srcDir: string, destDir: string) {
  if (!existsSync(destDir)) {
    await mkdir(destDir, { recursive: true });
  }
  
  const files = await readdir(srcDir);
  for (const file of files) {
    const srcPath = join(srcDir, file);
    const destPath = join(destDir, file);
    
    // Skip TypeScript files (they're compiled)
    if (file.endsWith(".ts")) continue;
    
    // Skip node_modules and dist directories
    if (file === "node_modules" || file === "dist") continue;
    
    const stat = await import("fs").then(fs => fs.promises.stat(srcPath));
    if (stat.isDirectory()) {
      await copyNonTsFiles(srcPath, destPath);
    } else {
      await copyFile(srcPath, destPath);
    }
  }
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
