import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.dirname(__dirname);

console.log("🚀 Preparing GitHub Pages deployment...");

// Paths
const buildClientDir = path.join(rootDir, "build", "client");
const bingoDir = path.join(buildClientDir, "bingo");
const assetsDir = path.join(buildClientDir, "assets");
const deployDir = path.join(rootDir, "deploy");

// Clean and create deploy directory
if (fs.existsSync(deployDir)) {
  fs.rmSync(deployDir, { recursive: true });
}
fs.mkdirSync(deployDir, { recursive: true });

// Copy bingo folder contents to deploy root
if (fs.existsSync(bingoDir)) {
  console.log("📁 Copying app files...");
  const bingoContents = fs.readdirSync(bingoDir);
  for (const item of bingoContents) {
    const srcPath = path.join(bingoDir, item);
    const destPath = path.join(deployDir, item);
    fs.cpSync(srcPath, destPath, { recursive: true });
  }
}

// Copy assets folder to deploy root
if (fs.existsSync(assetsDir)) {
  console.log("📦 Copying assets...");
  const deployAssetsDir = path.join(deployDir, "assets");
  fs.cpSync(assetsDir, deployAssetsDir, { recursive: true });
}

// Copy static files (images, etc.) to deploy root
console.log("🖼️ Copying static files...");
const staticFiles = fs.readdirSync(buildClientDir).filter((item) => {
  const itemPath = path.join(buildClientDir, item);
  return fs.statSync(itemPath).isFile();
});

for (const file of staticFiles) {
  const srcPath = path.join(buildClientDir, file);
  const destPath = path.join(deployDir, file);
  fs.copyFileSync(srcPath, destPath);
}

console.log("✅ Files prepared for deployment!");
console.log("📂 Deploy from:", deployDir);
console.log("");
console.log("🚀 Deploying to GitHub Pages...");

try {
  // Add, commit, and push using git subtree
  execSync("git add .", { cwd: rootDir, stdio: "inherit" });
  execSync('git commit -m "Build for deployment"', {
    cwd: rootDir,
    stdio: "inherit",
  });
  execSync("git subtree push --prefix deploy origin gh-pages", {
    cwd: rootDir,
    stdio: "inherit",
  });
  console.log("🎉 Successfully deployed to GitHub Pages!");
} catch (error) {
  console.error("❌ Deployment failed:", error.message);
  process.exit(1);
}
