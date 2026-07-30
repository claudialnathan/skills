# shadcn and Tailwind mechanics checklist

Apply only the rows relevant to the installed stack and changed surface.

- [ ] `components.json`, aliases, registry targets, CSS entry points, manifest,
      lockfile, resolved packages, and actual imports agree.
- [ ] Checked-in component source was edited at its configured canonical path;
      no `components/ui` location was assumed.
- [ ] Tailwind v4 versus legacy configuration was established from executable
      CSS/configuration, not a version label.
- [ ] Theme namespaces, `@theme inline`, dark-mode ownership, paired text
      line-height, and generated utility names were verified where affected.
- [ ] A named utility was checked before keeping an arbitrary value; a valid
      local arbitrary value was not promoted or blocked merely because it uses
      brackets, `px`, hex, RGB, or a raw palette.
- [ ] Project unit and color-space policy—not a universal rem/oklch rule—governs
      authored literals.
- [ ] Base UI parts use the installed `render` contract; Radix parts retain
      valid `asChild`; other libraries keep their own proven composition API.
- [ ] Every changed state selector was checked against the exact installed part
      type/source and rendered attribute. Presence and valued attributes use
      the correct selector shape.
- [ ] Controlled or uncontrolled wiring follows the parent coordination and
      persistence contract.
- [ ] Any custom text utility remains distinct through the project’s
      `tailwind-merge` configuration.
- [ ] Tailwind language-server diagnostics, CSS generation or computed style,
      and the changed interaction were exercised as applicable.
- [ ] Missing tooling, registry access, or runtime evidence is reported
      `Unverified`, never passed from memory.
