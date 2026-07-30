import { createHash } from "node:crypto";

export const TOOL_VERSION = "0.1.0";
export const RULESET_VERSION = "2026.07.29";
export const DEFAULT_CONFIG = "ui-preship.config.json";
export const DEFAULT_ARTIFACT_DIRECTORY = ".artifacts/ui-preship";

export const RULES = Object.freeze({
  UP001: {
    id: "UP001",
    kind: "deterministic",
    title: "Git diff check failed",
    description:
      "Git reported an exact whitespace or conflict-marker error in the assessed diff.",
    acceptance: "Correct the reported Git diff diagnostic and rerun the exact command.",
  },
  UP002: {
    id: "UP002",
    kind: "deterministic",
    title: "Configured project command failed",
    description:
      "A repository-configured argv or package-script command exited unsuccessfully.",
    acceptance:
      "Make the configured command pass, or explicitly make it optional in reviewed configuration.",
  },
  UP003: {
    id: "UP003",
    kind: "assessment",
    title: "Required tool is unavailable",
    description:
      "A required executable could not be resolved without installing or fetching anything.",
    acceptance: "Install or expose the configured tool, then rerun.",
  },
  UP004: {
    id: "UP004",
    kind: "assessment",
    title: "Required command timed out",
    description:
      "A required configured command exceeded its explicit timeout, so the target is unassessed.",
    acceptance: "Resolve the timeout or review the bounded timeout in configuration, then rerun.",
  },
  UP005: {
    id: "UP005",
    kind: "assessment",
    title: "Baseline evidence is stale",
    description:
      "The configured baseline does not match the active config or ruleset and cannot prove introduced debt.",
    acceptance:
      "Review and explicitly update the baseline with a reason and expiry, or remove reliance on it.",
  },
  UP006: {
    id: "UP006",
    kind: "assessment",
    title: "Configuration or scope is invalid",
    description:
      "The invocation, configuration, repository target, or Git evidence is missing or ambiguous.",
    acceptance: "Follow the reported remediation and rerun without implicit network access.",
  },
  UP101: {
    id: "UP101",
    kind: "advisory",
    title: "Base UI file adds asChild",
    description:
      "A file importing an installed Base UI package adds asChild, which may indicate a Radix contract was assumed.",
    acceptance:
      "Inspect the installed primitive contract and use its supported render composition when applicable.",
  },
  UP102: {
    id: "UP102",
    kind: "advisory",
    title: "Base UI file adds an unproven data-state variant",
    description:
      "A Base UI consumer adds a data-state variant that is absent from the installed type contract inspected by ui-preship.",
    acceptance:
      "Use the installed part-specific state attributes, or document why this attribute belongs to another primitive.",
  },
  UP110: {
    id: "UP110",
    kind: "advisory",
    title: "Layout evidence is required",
    description:
      "The assessed change touches layout-sensitive paths or added layout mechanisms.",
    acceptance: "Complete the activated width, zoom, content, direction, and overflow checks.",
  },
  UP111: {
    id: "UP111",
    kind: "advisory",
    title: "Motion evidence is required",
    description:
      "The assessed change touches temporal, transition, animation, or gesture mechanisms.",
    acceptance: "Complete normal, interrupted, reduced-motion, and applicable input-state checks.",
  },
  UP112: {
    id: "UP112",
    kind: "advisory",
    title: "Shared composition evidence is required",
    description:
      "The assessed change touches a shared component, token owner, registry, or catalog surface.",
    acceptance: "Trace consumers and verify representative states through the canonical owner.",
  },
  UP113: {
    id: "UP113",
    kind: "advisory",
    title: "Mutation and recovery evidence is required",
    description:
      "The assessed change touches mutation, optimistic, submission, authentication, or async recovery behavior.",
    acceptance: "Verify rejection, rollback/recovery, repetition, race, and precondition behavior.",
  },
  UP114: {
    id: "UP114",
    kind: "advisory",
    title: "Design and accessibility evidence is required",
    description:
      "The assessed UI change needs realistic visual states, focus, naming, and approval-boundary review.",
    acceptance: "Verify realistic states and accessibility without making unrequested visible redesigns.",
  },
  UP115: {
    id: "UP115",
    kind: "advisory",
    title: "Public output evidence is required",
    description:
      "The assessed change touches generated, metadata, image, document, or other public-output code.",
    acceptance: "Render or request the generated artifact directly and retain bounded proof.",
  },
});

export const RULESET_HASH = `sha256:${createHash("sha256")
  .update(JSON.stringify(RULES))
  .digest("hex")}`;
