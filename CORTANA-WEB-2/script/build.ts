import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile, copyFile, cp, mkdir, readdir, stat } from "fs/promises";
import * as path from "path";

// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times
const allowlist = [
  "@google/generative-ai",
  "axios",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "pg",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  await viteBuild();

  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: externals,
    logLevel: "info",
  });

  // Copy menu files to dist folder
  console.log("copying menu files...");
  try {
    await copyFile("server/menu.txt", "dist/menu.txt");
    console.log("✓ menu.txt copied");
  } catch (e) {
    console.warn("menu.txt not found, skipping...");
  }
  try {
    await copyFile("server/menu-working.txt", "dist/menu-working.txt");
    console.log("✓ menu-working.txt copied");
  } catch (e) {
    console.warn("menu-working.txt not found, skipping...");
  }
  try {
    await copyFile("server/menu-ultra.txt", "dist/menu-ultra.txt");
    console.log("✓ menu-ultra.txt copied");
  } catch (e) {
    console.warn("menu-ultra.txt not found, skipping...");
  }
  try {
    await copyFile("server/bug-menu.txt", "dist/bug-menu.txt");
    console.log("✓ bug-menu.txt copied");
  } catch (e) {
    console.warn("bug-menu.txt not found, skipping...");
  }


  // Manual Recursive Copy Function (Node < 16.7 compat)
  // Uses the already-imported modules from top of file (ES Module compatible)
  async function copyDir(src: string, dest: string) {
    await mkdir(dest, { recursive: true });
    const entries = await readdir(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        await copyDir(srcPath, destPath);
      } else {
        await copyFile(srcPath, destPath);
      }
    }
  }

  // Copy Bug Bot Engine (isolated exploit bot)
  console.log("copying bugbot engine...");
  try {
    await copyDir("server/bugbot", "dist/bugbot");
    console.log("✓ bugbot copied");
  } catch (e) {
    console.warn("bugbot folder not found, skipping...");
  }

  // Copy Critical JS Engines (Runtime Required)
  const criticalEngines = ['react-engine.js', 'proxies.js'];
  for (const file of criticalEngines) {
    try {
      await copyFile(`server/${file}`, `dist/${file}`);
      console.log(`✓ ${file} copied`);
    } catch (e) {
      console.warn(`Warning: ${file} not found.`);
    }
  }
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});

