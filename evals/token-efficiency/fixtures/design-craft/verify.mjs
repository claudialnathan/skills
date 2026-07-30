import { readFileSync } from "node:fs";
import { join } from "node:path";

export function verifyDesignCraftFixture({ caseId, workspaceRoot, diff }) {
  const failures = [];
  const styles = readOptional(join(workspaceRoot, "styles.css"));

  if (caseId === "DC-IMPLEMENT-001") {
    requirePattern(
      styles,
      /\.profile-header\s*\{[\s\S]*?box-shadow:\s*none\s*;/,
      "profile header removes the floating shadow",
      failures,
    );
    requirePattern(
      styles,
      /\.profile-header\s*\{[\s\S]*?border(?:-color)?:\s*(?:1px solid )?var\(--border-subtle\)\s*;/,
      "profile header uses the subtle border role",
      failures,
    );
  } else if (caseId === "DC-LOAD-001") {
    requirePattern(
      styles,
      /\.activity-card\s*\{[\s\S]*?box-shadow:\s*var\(--shadow-card\)\s*;/,
      "activity card uses the existing shadow token",
      failures,
    );
  } else if (diff.trim()) {
    failures.push("read-only or no-change fixture was modified");
  }

  return {
    passed: failures.length === 0,
    failures,
  };
}

function readOptional(path) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return "";
  }
}

function requirePattern(source, pattern, message, failures) {
  if (!pattern.test(source)) failures.push(message);
}
