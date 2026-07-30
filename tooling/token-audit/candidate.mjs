import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join, relative } from "node:path";
import { parseFrontmatter } from "./audit.mjs";

export function validateCandidatePackage(directory) {
  const errors = [];
  const skillPath = join(directory, "SKILL.md");
  if (!existsSync(skillPath)) {
    return { errors: [`Missing ${skillPath}.`] };
  }
  const source = readFileSync(skillPath, "utf8");
  const frontmatter = parseFrontmatter(source);
  if (!frontmatter.name) errors.push("SKILL.md is missing frontmatter name.");
  if (!frontmatter.description) {
    errors.push("SKILL.md is missing frontmatter description.");
  }
  const description = String(frontmatter.description ?? "");
  const whenToUse = String(frontmatter.when_to_use ?? "");
  if (description.length > 1024) {
    errors.push(`Description is ${description.length} characters; maximum is 1024.`);
  }
  if (`${description}${whenToUse}`.length > 1536) {
    errors.push("Combined description and when_to_use exceed 1536 characters.");
  }

  const allFiles = listFiles(directory);
  for (const file of allFiles) {
    const contents = readFileSync(file);
    const text = contents.toString("utf8");
    if (text.includes("```!")) {
      errors.push(`${relative(directory, file)} contains the triple-backtick loader trigger.`);
    }
    if (text.includes("!`")) {
      errors.push(`${relative(directory, file)} contains the bang-backtick loader trigger.`);
    }
  }

  const declaredReferences = new Set(
    source.match(/references\/[A-Za-z0-9_.-]+\.md/g) ?? [],
  );
  for (const reference of declaredReferences) {
    if (!existsSync(join(directory, reference))) {
      errors.push(`Dangling reference: ${reference}.`);
    }
  }
  const referenceDirectory = join(directory, "references");
  if (existsSync(referenceDirectory)) {
    for (const entry of readdirSync(referenceDirectory, {
      withFileTypes: true,
    })) {
      if (
        entry.isFile() &&
        entry.name.endsWith(".md") &&
        !declaredReferences.has(`references/${entry.name}`)
      ) {
        errors.push(`Orphan reference: references/${entry.name}.`);
      }
    }
  }

  const openAiPath = join(directory, "agents/openai.yaml");
  if (!existsSync(openAiPath)) {
    errors.push("Missing agents/openai.yaml.");
  } else {
    const openAi = readFileSync(openAiPath, "utf8");
    if (!/^\s*allow_implicit_invocation:\s*true\s*$/m.test(openAi)) {
      errors.push("agents/openai.yaml must enable implicit invocation.");
    }
    if (/allow_implicit_invocation:\s*false/m.test(openAi)) {
      errors.push("agents/openai.yaml disables implicit invocation.");
    }
  }
  if (/^disable-model-invocation:\s*true\s*$/m.test(source)) {
    errors.push("SKILL.md disables model invocation.");
  }
  if (
    !/^> This skill draws inspiration from publicly available content from .+\.$/m.test(
      source,
    )
  ) {
    errors.push("SKILL.md is missing the repository Sources sentence.");
  }
  return {
    name: String(frontmatter.name ?? basename(directory)),
    descriptionCharacters: description.length,
    files: allFiles.length,
    errors,
  };
}

function listFiles(directory) {
  if (!existsSync(directory)) return [];
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...listFiles(path));
    else if (entry.isFile()) files.push(path);
  }
  return files.sort();
}
