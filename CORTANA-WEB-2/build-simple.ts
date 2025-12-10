import { build as viteBuild } from "vite";
import { rm, mkdir, copyFile, readdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";

async function buildAll() {
  await rm("dist", { recursive: true, force: true });
  
  console.log("building client...");
  await viteBuild();
  
  console.log("building server...");
  
  // Compile server TypeScript using tsc
  const { exec } = await import("child_process");
  const { promisify } = await import("util");
  const execAsync = promisify(exec);
  
  try {
    // Create a tsconfig for server compilation
    const tsconfig = {
      extends: "./tsconfig.json",
      compilerOptions: {
        module: "NodeNext",
        moduleResolution: "NodeNext",
        outDir: "dist",
        rootDir: ".",
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
        skipLibCheck: true,
        noEmit: false,
        target: "ES2022"
      },
      include: ["server/**/*", "shared/**/*"],
      exclude: ["node_modules", "client", "dist"]
    };
    
    await execAsync("npx tsc --project tsconfig.server.json");
    
    // Copy shared files if needed
    if (existsSync("shared")) {
      await mkdir("dist/shared", { recursive: true });
      const files = await readdir("shared");
      for (const file of files) {
        if (file.endsWith(".ts")) continue; // Skip .ts files
        await copyFile(join("shared", file), join("dist/shared", file));
      }
    }
    
    console.log("Server built successfully");
  } catch (error) {
    console.error("Failed to build server:", error);
    process.exit(1);
  }
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
