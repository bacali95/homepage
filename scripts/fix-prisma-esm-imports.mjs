#!/usr/bin/env node
/**
 * Fixes ESM imports in Prisma generated files
 * Replaces .ts extensions with .js in import/export statements
 */
/* global console, process */
import { readdir, readFile, stat, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PRISMA_GENERATED_DIR = join(__dirname, "../shared/generated/client");
const PRISMA_COMPILED_DIR = join(
  __dirname,
  "../dist-server/shared/generated/client"
);

async function isFile(path) {
  try {
    const stats = await stat(path);
    return stats.isFile();
  } catch {
    return false;
  }
}

async function fixImportsInFile(filePath) {
  const content = await readFile(filePath, "utf-8");

  // Replace .ts extensions with .js in import/export statements
  // This handles:
  // - import ... from "./file.ts"
  // - import type ... from "./file.ts"
  // - export ... from "./file.ts"
  // - export type ... from "./file.ts"
  const fixed = content.replace(
    /(import\s+(?:type\s+)?.*?\s+from\s+['"]|export\s+(?:type\s+)?.*?\s+from\s+['"])(\.\/?.*?)\.ts(['"])/g,
    (match, prefix, path, quote) => {
      return `${prefix}${path}.js${quote}`;
    }
  );

  if (content !== fixed) {
    await writeFile(filePath, fixed, "utf-8");
    console.log(`Fixed imports in: ${filePath}`);
    return true;
  }
  return false;
}

async function processDirectory(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  let fixedCount = 0;

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      fixedCount += await processDirectory(fullPath);
    } else if (
      entry.isFile() &&
      (entry.name.endsWith(".js") || entry.name.endsWith(".ts"))
    ) {
      if (await fixImportsInFile(fullPath)) {
        fixedCount++;
      }
    }
  }

  return fixedCount;
}

async function main() {
  try {
    console.log("Fixing ESM imports in Prisma generated files...");
    let totalFixed = 0;

    // Fix source files (after Prisma generation)
    if (await isFile(join(PRISMA_GENERATED_DIR, "client.ts"))) {
      const fixedCount = await processDirectory(PRISMA_GENERATED_DIR);
      totalFixed += fixedCount;
      console.log(`Fixed imports in ${fixedCount} source file(s).`);
    }

    // Fix compiled files (after TypeScript compilation)
    if (await isFile(join(PRISMA_COMPILED_DIR, "client.js"))) {
      const fixedCount = await processDirectory(PRISMA_COMPILED_DIR);
      totalFixed += fixedCount;
      console.log(`Fixed imports in ${fixedCount} compiled file(s).`);
    }

    if (totalFixed === 0) {
      console.log("No Prisma files found to fix.");
    } else {
      console.log(`Total: Fixed imports in ${totalFixed} file(s).`);
    }
  } catch (error) {
    console.error("Error fixing Prisma imports:", error);
    process.exit(1);
  }
}

main();
