import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { isUiSource } from "./detect-stack.mjs";

const LENS_RULES = {
  layout: {
    ruleId: "UP110",
    path: /(?:layout|grid|stack|sidebar|shell|page|responsive)/i,
    source:
      /\b(?:grid|flex|overflow|container|breakpoint|sticky|fixed|inset|safe-area|scroll|w-|h-|min-w|max-w|min-h|max-h|gap-|space-|columns?)\b/i,
  },
  motion: {
    ruleId: "UP111",
    path: /(?:motion|transition|animation|gesture|spring|easing)/i,
    source:
      /\b(?:animate|animation|transition|duration|easing|spring|layoutId|view-transition|will-change|transform|drag|gesture)\b/i,
  },
  composition: {
    ruleId: "UP112",
    path:
      /(?:components?\/(?:ui|shared)|design-system|tokens?|registry|catalog|storybook|components?\.json|globals?\.css)/i,
    source:
      /\b(?:createContext|forwardRef|variants?|slots?|render\s*=|asChild|data-slot|--[a-z0-9-]+)\b/i,
  },
  mutation: {
    ruleId: "UP113",
    path: /(?:mutation|optimistic|auth|submit|action|request|query|form)/i,
    source:
      /\b(?:useOptimistic|mutate|mutation|rollback|revalidate|invalidate|submit|pending|loading|fetch|async|await|signIn|signOut)\b/i,
  },
  design: {
    ruleId: "UP114",
    path: /(?:components?|styles?|theme|tokens?|ui|design)/i,
    source:
      /\b(?:aria-|role=|focus|outline|contrast|color|background|border|shadow|font|leading|tracking|icon|image|disabled|selected|expanded)\b/i,
  },
  publicOutput: {
    ruleId: "UP115",
    path: /(?:opengraph|twitter-image|sitemap|robots|manifest|metadata|pdf|email|export|image-response)/i,
    source: /\b(?:ImageResponse|generateMetadata|sitemap|robots|renderToStaticMarkup|pdf|canvas)\b/i,
  },
};

const EVIDENCE_RECIPES = {
  layout: [
    ["minimum width", "render at the configured minimum width, default 320 px"],
    ["intermediate pressure", "render one content-driven intermediate pressure point"],
    ["wide state", "render a representative wide viewport"],
    ["zoom and content", "check 200% zoom plus long, localized, and unbroken content"],
    ["direction and input", "check applicable RTL, keyboard, scroll, sticky, and overflow behavior"],
  ],
  motion: [
    ["normal motion", "observe the complete interaction at normal speed"],
    ["interruption", "test slow playback and rapid reversal or interruption"],
    ["reduced motion", "verify a useful reduced-motion state"],
    ["input and lifecycle", "check applicable keyboard, pointer, touch, mount, and busy-page states"],
  ],
  composition: [
    ["consumer trace", "trace every static consumer of the changed owner"],
    ["representative states", "verify highest-risk consumers and meaningful catalog states"],
    ["bypass search", "search for obsolete clones, direct bypasses, and runtime non-page outputs"],
  ],
  mutation: [
    ["rejection", "force rejection and verify rollback or recovery"],
    ["repeat and race", "exercise rapid repeat, double-submit, and stale-response ordering"],
    ["read state", "compare cold and cached reads plus irreversible server preconditions"],
  ],
  design: [
    ["realistic states", "inspect realistic content and relevant visual states"],
    ["accessibility path", "verify keyboard focus, accessible names, and state distinctions"],
    ["visible authority", "obtain approval before unrequested visible design changes"],
  ],
  publicOutput: [
    ["generated artifact", "request or render the generated public artifact directly"],
    ["output fidelity", "inspect its content type, dimensions, semantics, and representative content"],
  ],
};

async function currentFileText(root, file) {
  if (file.status === "D") return "";
  try {
    return (await readFile(resolve(root, file.path), "utf8")).slice(0, 300_000);
  } catch {
    return "";
  }
}

function warning(ruleId, path, line, evidence, extra = {}) {
  return {
    ruleId,
    severity: "warning",
    deterministic: false,
    effectiveBlocker: false,
    path,
    line,
    evidence,
    ...extra,
  };
}

export async function classifyDiff(root, scope, stack) {
  const findings = [];
  const activated = new Map();

  for (const file of scope.files) {
    if (!isUiSource(file.path)) continue;
    const currentText = await currentFileText(root, file);
    const addedText = file.additions.map((item) => item.text).join("\n");
    const source = scope.kind === "all" ? currentText : addedText;
    if (!source && file.status !== "D") continue;

    for (const [lens, contract] of Object.entries(LENS_RULES)) {
      if (contract.path.test(file.path) || contract.source.test(source)) {
        if (!activated.has(lens)) {
          const firstMatch =
            file.additions.find((addition) => contract.source.test(addition.text)) ??
            file.additions[0];
          activated.set(lens, {
            ruleId: contract.ruleId,
            path: file.path,
            line: firstMatch?.line ?? null,
          });
        }
      }
    }

    const importsBaseUi = /from\s+["']@base-ui-components\/react(?:\/[^"']*)?["']/.test(
      currentText,
    );
    if (stack.baseUi.installed && importsBaseUi) {
      const asChild = file.additions.find((addition) => /\basChild\b/.test(addition.text));
      if (asChild) {
        findings.push(
          warning(
            "UP101",
            file.path,
            asChild.line,
            "Installed Base UI ownership plus an added asChild token.",
            { stackVersion: stack.baseUi.version },
          ),
        );
      }

      const invalidState = file.additions.find((addition) =>
        /data-\[state=[^\]]+\]/.test(addition.text),
      );
      if (
        invalidState &&
        stack.baseUi.stateAttributes.length > 0 &&
        !stack.baseUi.stateAttributes.includes("data-state")
      ) {
        findings.push(
          warning(
            "UP102",
            file.path,
            invalidState.line,
            "The installed Base UI type declarations expose state attributes, but not data-state.",
            {
              installedStateAttributes: stack.baseUi.stateAttributes.slice(0, 30),
              stackVersion: stack.baseUi.version,
            },
          ),
        );
      }
    }
  }

  const requiredEvidence = [];
  const decisions = [];
  for (const [lens, activation] of activated) {
    findings.push(
      warning(
        activation.ruleId,
        activation.path,
        activation.line,
        `Activated ${lens} evidence from the assessed UI change.`,
        { lens },
      ),
    );
    for (const [state, mechanism] of EVIDENCE_RECIPES[lens]) {
      requiredEvidence.push({
        lens,
        state,
        mechanism,
        artifact: activation.path,
        status: "unverified",
      });
    }
    if (lens === "design") {
      decisions.push({
        id: "DECIDE-VISIBLE-CHANGE",
        lens,
        path: activation.path,
        question: "Does any proposed visible design change exceed the user's explicit authority?",
        status: "decision-required",
      });
    }
  }

  return {
    findings,
    decisions,
    requiredEvidence,
    activatedLenses: [...activated.keys()],
  };
}
