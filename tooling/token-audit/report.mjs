export function renderHuman(report, comparison) {
  const lines = [
    `TOKEN EFFICIENCY — ${report.assessment}`,
    "",
    "Standing catalog",
  ];
  for (const row of report.catalog) {
    lines.push(
      `  ${row.name.padEnd(28)} ${String(
        row.descriptionAndWhenToUse.characters,
      ).padStart(5)} chars  ${row.implicit ? "implicit" : "manual"}`,
    );
  }
  lines.push(
    "",
    "Structural surfaces",
    `  main files                 ${report.summary.mainCharacters} chars`,
    `  direct references          ${report.summary.directReferenceCharacters} chars`,
    `  declared route bundles     ${report.summary.potentialRouteCharacters} chars potential`,
    `  generated prompts          ${report.summary.generatedPromptCharacters} chars`,
    `  command output surfaces    ${report.commandOutputRisks.length} declared; actual unavailable without trace`,
  );

  if (report.installedRegistrations) {
    lines.push("", "Installed registrations");
    for (const duplicate of report.installedDuplicates ?? []) {
      lines.push(
        `  warn: ${duplicate.name} has ${duplicate.count} ${duplicate.harness} registrations`,
      );
      for (const source of duplicate.sources) lines.push(`    ${source}`);
    }
    if ((report.installedDuplicates ?? []).length === 0) {
      lines.push("  no duplicate canonical names found on inspected surfaces");
    }
  }

  const warnings = report.findings.filter(
    (finding) => finding.level !== "info",
  );
  lines.push("", "Findings");
  if (warnings.length === 0) lines.push("  none");
  else {
    for (const finding of warnings) {
      lines.push(
        `  ${finding.level}: ${finding.id} ${finding.path ?? finding.name ?? ""} — ${finding.message}`.trimEnd(),
      );
    }
  }

  if (comparison) {
    lines.push("", "Baseline comparison");
    for (const [metric, row] of Object.entries(comparison.summary)) {
      const sign = row.delta > 0 ? "+" : "";
      lines.push(
        `  ${metric.padEnd(28)} ${row.current} (${sign}${row.delta})`,
      );
    }
    for (const control of comparison.controls) {
      lines.push(
        `  ${control.name.padEnd(28)} ${control.unchanged ? "control unchanged" : "ERROR: live control drifted"}`,
      );
    }
  }

  lines.push(
    "",
    `${report.summary.errors} errors · ${report.summary.warnings} warnings. Static structure is not runtime token use or quality proof.`,
  );
  return `${lines.join("\n")}\n`;
}

export function explainRule(id) {
  const rules = {
    TE001: "Duplicate canonical names in one published package are invalid.",
    TE002: "Description exceeds the Agent Skills hard specification limit.",
    TE003: "Description crossed the advisory standing-context review threshold.",
    TE004: "Combined catalog fields exceed the Claude listing hard limit.",
    TE005: "SKILL.md crossed the advisory router-size review threshold.",
    TE006: "A declared direct reference is missing.",
    TE007: "A reference crossed the advisory single-file review threshold.",
    TE008: "A declared generated prompt exceeds its hard character budget.",
    TE009: "A declared generated prompt crossed its advisory review threshold.",
    TE010: "A canonical name appears through multiple machine-local registrations.",
    TE011: "The requested Git base for changed-file reporting could not be resolved.",
  };
  return rules[id];
}
