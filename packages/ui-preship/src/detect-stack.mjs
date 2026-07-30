import { readdir, readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";

async function readJson(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return null;
  }
}

function dependencies(manifest) {
  return {
    ...(manifest?.dependencies ?? {}),
    ...(manifest?.devDependencies ?? {}),
    ...(manifest?.peerDependencies ?? {}),
    ...(manifest?.optionalDependencies ?? {}),
  };
}

async function collectTypeFiles(directory, output, depth = 0) {
  if (depth > 5 || output.length >= 120) return;
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (output.length >= 120) return;
    const absolute = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      await collectTypeFiles(absolute, output, depth + 1);
    } else if (entry.isFile() && (entry.name.endsWith(".d.ts") || entry.name.endsWith(".d.mts"))) {
      output.push(absolute);
    }
  }
}

async function inspectBaseUiContract(root) {
  const packageRoot = resolve(root, "node_modules/@base-ui-components/react");
  const manifest = await readJson(resolve(packageRoot, "package.json"));
  if (!manifest) return { installed: false, version: null, stateAttributes: [] };

  const files = [];
  const directTypes = [manifest.types, manifest.typings].filter(
    (value) => typeof value === "string",
  );
  for (const path of directTypes) files.push(resolve(packageRoot, path));
  await collectTypeFiles(packageRoot, files);

  const attributes = new Set();
  for (const path of [...new Set(files)]) {
    let source;
    try {
      source = await readFile(path, "utf8");
    } catch {
      continue;
    }
    for (const match of source.matchAll(/["'](data-[a-z0-9-]+)["']\s*[?:]/gi)) {
      attributes.add(match[1]);
    }
  }
  return {
    installed: true,
    version: manifest.version ?? null,
    stateAttributes: [...attributes].sort(),
  };
}

export async function detectStack(root, config) {
  const manifests = [];
  const roots = [".", ...config.workspaces];
  for (const workspace of roots) {
    const manifest = await readJson(resolve(root, workspace, "package.json"));
    if (manifest) manifests.push({ workspace, manifest });
  }
  const allDependencies = Object.assign(
    {},
    ...manifests.map(({ manifest }) => dependencies(manifest)),
  );
  const baseUi = await inspectBaseUiContract(root);

  return {
    manifests: manifests.map(({ workspace, manifest }) => ({
      workspace,
      name: manifest.name ?? null,
    })),
    react: Boolean(allDependencies.react || allDependencies["react-dom"]),
    next: Boolean(allDependencies.next),
    tailwind: Boolean(
      allDependencies.tailwindcss ||
        allDependencies["@tailwindcss/postcss"] ||
        allDependencies["@tailwindcss/vite"],
    ),
    baseUi: {
      declared: Boolean(allDependencies["@base-ui-components/react"]),
      ...baseUi,
    },
    radix: Object.keys(allDependencies).some((name) => name.startsWith("@radix-ui/")),
    uiCapable: Boolean(
      allDependencies.react ||
        allDependencies.next ||
        allDependencies.vue ||
        allDependencies.svelte ||
        allDependencies["@angular/core"],
    ),
  };
}

export function isUiSource(path) {
  const extension = extname(path).toLowerCase();
  return [
    ".css",
    ".html",
    ".jsx",
    ".mdx",
    ".scss",
    ".svelte",
    ".tsx",
    ".vue",
  ].includes(extension);
}
