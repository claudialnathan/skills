#!/usr/bin/env node
// Deterministic probe grader — zero LLM tokens.
// Reads probe run artifacts (OUTPUT.md, DIFF.patch) and checks mechanical pass/fail
// criteria from skills/*/evals/probes.md.
//
//   node evals/grade-probe.js --all --scratchpad /path/to/scratchpad
//   node evals/grade-probe.js --run-id sd1-sk --scratchpad /path/to/scratchpad
//   node evals/grade-probe.js --all --scratchpad /path --json

const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const DEFAULT_SCRATCHPAD = path.join(ROOT, '.eval-runs')

const argv = process.argv.slice(2)
const opt = (flag, def) => {
  const i = argv.indexOf(flag)
  return i >= 0 && argv[i + 1] ? argv[i + 1] : def
}
const has = (flag) => argv.includes(flag)

const SCRATCHPAD = opt('--scratchpad', process.env.PROBE_SCRATCHPAD || DEFAULT_SCRATCHPAD)
const RUN_ID = opt('--run-id', null)
const AS_JSON = has('--json')
const ALL = has('--all')

const SKILL_PREFIX = {
  sd: 'speed-daemon',
  fm: 'flavored-md',
  de: 'design-engineer',
  st: 'shadcn-tailwind',
  sa: 'saltintesta',
  zo: 'zoom-out',
}

function parseRunId(id) {
  const m = id.match(/^(sd|fm|de|st|sa|zo)(\d+)-(un|sk)(?:-r\d+)?$/)
  if (!m) return null
  return {
    id,
    prefix: m[1],
    probe: Number(m[2]),
    leg: m[3] === 'sk' ? 'skill' : 'unaided',
    skill: SKILL_PREFIX[m[1]],
  }
}

function readRun(runId) {
  const dir = path.join(SCRATCHPAD, 'runs', runId)
  const outputPath = path.join(dir, 'OUTPUT.md')
  const diffPath = path.join(dir, 'DIFF.patch')
  if (!fs.existsSync(outputPath)) {
    return { ok: false, reason: 'missing OUTPUT.md' }
  }
  const output = fs.readFileSync(outputPath, 'utf8')
  if (/session limit/i.test(output)) {
    return { ok: false, reason: 'session limit' }
  }
  const diff = fs.existsSync(diffPath) ? fs.readFileSync(diffPath, 'utf8') : ''
  const text = `${output}\n${diff}`
  return { ok: true, output, diff, text, dir }
}

function result(meta, mechanical, notes, signals = []) {
  const expectPass = meta.leg === 'skill'
  const servesClaim =
    mechanical === 'inconclusive'
      ? 'inconclusive'
      : expectPass
        ? mechanical === 'pass'
          ? 'yes'
          : 'no'
        : mechanical === 'fail'
          ? 'yes'
          : mechanical === 'pass'
            ? 'absorbed'
            : 'no'
  const status =
    mechanical === 'inconclusive'
      ? 'inconclusive'
      : expectPass
        ? mechanical === 'pass'
          ? 'ok'
          : 'fail'
        : mechanical === 'fail'
          ? 'ok'
          : 'fail'
  return {
    ...meta,
    mechanical,
    servesClaim,
    status,
    notes,
    signals,
  }
}

function hasAny(text, patterns) {
  return patterns.some((p) => (typeof p === 'string' ? text.includes(p) : p.test(text)))
}

function gradeSpeedDaemon(probe, run) {
  const { text, diff, output } = run
  switch (probe) {
    case 1: {
      const optimistic =
        /onMutate[\s\S]{0,400}(setQueryData|setFavorite|setState)/.test(diff) ||
        (/setQueryData|setState/.test(diff) && /onMutate/.test(diff))
      const pessimistic =
        hasAny(text, [
          /isPending/i,
          /isLoading/i,
          /disabled=\{.*pending/i,
          /await\s+updateIssue[\s\S]{0,120}set/i,
          /setLoading\s*\(\s*true/i,
        ]) && !optimistic
      if (optimistic && /onError|rollback|revert/i.test(text + diff)) {
        return result(run.meta, 'pass', 'Optimistic flip with rollback path', ['onMutate', 'onError'])
      }
      if (pessimistic) return result(run.meta, 'fail', 'Pessimistic / loading-gated mutation', ['pessimistic'])
      if (optimistic) return result(run.meta, 'pass', 'Optimistic update present', ['onMutate'])
      return result(run.meta, 'inconclusive', 'No clear mutation pattern in diff')
    }
    case 2: {
      const optimistic = /onMutate/.test(diff) && /title/.test(diff)
      const revertUntilSave = hasAny(text, [/disabled.*saving/i, /spinner.*save/i, /old value until/i])
      if (optimistic && /onError|prev|revert/i.test(text + diff)) {
        return result(run.meta, 'pass', 'Title updates optimistically with rollback', ['onMutate+title'])
      }
      if (revertUntilSave) return result(run.meta, 'fail', 'Save gated on network', ['revert-until-save'])
      if (optimistic) return result(run.meta, 'pass', 'Optimistic title path', ['onMutate'])
      return result(run.meta, 'inconclusive', 'Inline edit pattern unclear')
    }
    case 3: {
      const optimistic =
        /onMutate/.test(diff) && /filter|remove|delete/i.test(diff + output)
      const waitsForServer = hasAny(text, [/pending.*delete/i, /loading.*delete/i, /until.*confirm/i])
      if (optimistic) return result(run.meta, 'pass', 'Immediate removal with mutation', ['onMutate+delete'])
      if (waitsForServer) return result(run.meta, 'fail', 'Delete gated on response', ['wait-for-server'])
      return result(run.meta, 'inconclusive', 'Delete pattern unclear')
    }
    case 4: {
      const spinnerGate = /if\s*\(\s*isLoading\s*\)\s*return\s*<[^>]*(Spinner|Loading|Skeleton)/i.test(diff)
      const tokenFirst =
        /localStorage|session_token|hasToken|sessionToken/.test(diff) &&
        /return\s*\(\s*<\s*(main|div)/i.test(diff)
      if (spinnerGate) return result(run.meta, 'fail', 'Render gated on isLoading spinner', ['isLoading-gate'])
      if (tokenFirst) return result(run.meta, 'pass', 'Renders on token; validation in background', ['token-first'])
      return result(run.meta, 'inconclusive', 'Auth gate pattern unclear')
    }
    case 5: {
      const deferred = hasAny(text + diff, [
        /useDeferredValue/i,
        /startTransition/i,
        /scheduler\.yield/i,
        /deferredValue/i,
      ])
      const syncFilter = /onChange[\s\S]{0,200}filterRows\s*\(/.test(diff) && !deferred
      if (deferred) return result(run.meta, 'pass', 'Deferred / transitioned filter', ['deferred'])
      if (syncFilter) return result(run.meta, 'fail', 'Synchronous filter on keystroke', ['sync-filter'])
      return result(run.meta, 'inconclusive', 'Search/filter pattern unclear')
    }
    default:
      return result(run.meta, 'inconclusive', `Unknown speed-daemon probe ${probe}`)
  }
}

function gradeFlavoredMd(probe, run) {
  const { text, diff } = run
  switch (probe) {
    case 1: {
      if (/>\s*\[!WARNING\]/i.test(diff + text) || />\s*\[!IMPORTANT\]/i.test(diff + text)) {
        return result(run.meta, 'pass', 'GitHub alert syntax', ['alert'])
      }
      if (/>\s*\*\*Warning:\*\*/.test(diff + text)) {
        return result(run.meta, 'fail', 'Bold-blockquote warning (wrong syntax)', ['bold-blockquote'])
      }
      return result(run.meta, 'inconclusive', 'No alert block found')
    }
    case 4: {
      if (/<details[\s>]/.test(diff + text) && /<summary>/.test(diff + text)) {
        return result(run.meta, 'pass', 'Details fold present', ['details'])
      }
      if ((diff.match(/^\+/gm) || []).length > 40 && !/<details/.test(diff)) {
        return result(run.meta, 'fail', 'Long inline config without fold', ['inline-bloat'])
      }
      return result(run.meta, 'inconclusive', 'Fold pattern unclear')
    }
    default:
      return result(run.meta, 'inconclusive', `No static grader for flavored-md probe ${probe}`)
  }
}

function gradeDesignEngineer(probe, run) {
  const { text, diff, output } = run
  switch (probe) {
    case 1: {
      const pushback = hasAny(output, [
        /100\+\/day/i,
        /frequency/i,
        /high-frequency/i,
        /keyboard surface/i,
        /no animation/i,
        /zero animation/i,
        /shouldn.t animate/i,
      ])
      const animated = /transition|duration-|scale|opacity|animate/i.test(diff)
      if (pushback && !animated) return result(run.meta, 'pass', 'Frequency pushback, no animation', ['pushback'])
      if (pushback && animated && /since you asked|you asked for|floor where motion/i.test(output)) {
        return result(run.meta, 'pass', 'Frequency reasoning with minimal floor animation', ['pushback+tuned'])
      }
      if (animated && !pushback) return result(run.meta, 'fail', 'Animated without frequency argument', ['animated'])
      return result(run.meta, 'inconclusive', 'Frequency probe unclear')
    }
    case 3: {
      if (/min-h-dvh|100dvh/.test(diff)) return result(run.meta, 'pass', 'Dynamic viewport height', ['dvh'])
      if (/min-h-screen|h-screen|100vh/.test(diff)) {
        return result(run.meta, 'fail', 'Classic viewport units', ['vh'])
      }
      return result(run.meta, 'inconclusive', 'Viewport unit pattern unclear')
    }
    case 4: {
      const polish = hasAny(diff, [/tabular-nums/i, /focus-visible/i, /active:scale/i, /text-balance/i])
      if (polish) return result(run.meta, 'pass', 'Unprompted polish present', ['polish'])
      return result(run.meta, 'fail', 'Literal ask only', ['no-polish'])
    }
    default:
      return result(run.meta, 'inconclusive', `No static grader for design-engineer probe ${probe}`)
  }
}

function gradeShadcnTailwind(probe, run) {
  const { diff } = run
  if (probe === 4) {
    if (/text-\[13px\]|#6b7280|text-\[#6b7280\]/i.test(diff)) {
      return result(run.meta, 'fail', 'Literal px/hex from spec', ['px-hex'])
    }
    if (/text-caption|text-muted-foreground|oklch|semantic token/i.test(diff)) {
      return result(run.meta, 'pass', 'Token mapping instead of literal spec', ['tokens'])
    }
    return result(run.meta, 'inconclusive', 'Token mapping unclear')
  }
  return result(run.meta, 'inconclusive', `No static grader for shadcn-tailwind probe ${probe}`)
}

function gradeSaltintesta(probe, run) {
  const { output } = run
  const bad = [
    /In today'?s (rapidly evolving|world)/i,
    /We're excited to announce/i,
    /it's not just .+ — it's/i,
    /At the end of the day/i,
    /potentially take into account/i,
    /supercharge|seamless experience|powerful feature/i,
  ]
  // Grade the produced prose, not meta-commentary quoting the fixture.
  let body = output
  const quote = output.match(/>\s*(.+)/)
  if (probe === 2 && quote) body = quote[1]
  if (probe === 2 && /filler|no claim|all frame|nothing from the original|exposes:/i.test(output)) {
    if (!bad.some((p) => p.test(body))) {
      return result(run.meta, 'pass', 'Recognized empty paragraph; rewrite clean', ['honest-verdict'])
    }
  }
  const hits = bad.filter((p) => p.test(body))
  if (hits.length === 0 && output.trim().length > 80) {
    return result(run.meta, 'pass', 'No mechanical antipattern hits', ['clean-tells'])
  }
  if (hits.length > 0) {
    return result(run.meta, 'fail', `Antipattern tells: ${hits.length}`, hits.map(String))
  }
  return result(run.meta, 'inconclusive', 'Output too short for tell scan')
}

function gradeZoomOut(probe, run) {
  const { output } = run
  if (output.trim().length < 80) {
    return result(run.meta, 'inconclusive', 'Transcript too short')
  }
  const docContradiction = hasAny(output, [
    /contradict/i,
    /telemetry|metrics\.tally|ping/i,
    /data never leaves/i,
    /zero dependencies/i,
    /false claim/i,
    /README claim/i,
  ])
  const history = hasAny(output, [/commit history/i, /of the \d+ commits/i, /last twenty commits/i, /effort went/i])
  const frameChallenge = hasAny(output, [
    /marketing is way ahead/i,
    /Watson clone/i,
    /wrong opponent/i,
    /reframe/i,
    /stated goal/i,
    /evidence-based/i,
    /buried.*reconstruct/i,
  ])
  const optionsMenu = /I could .{0,40}\b(or|and)\b .{0,40}\?/i.test(output) ||
    /which would you (like|prefer)/i.test(output)
  const verdict = hasAny(output, [/one-sentence verdict/i, /short version/i, /my (forward )?take/i, /prioritizing:/i])
  const forward = hasAny(output, [/could become/i, /evidence-based tracker/i, /reconstruct/i, /flagship command/i])

  switch (probe) {
    case 1:
      if (docContradiction && frameChallenge) {
        return result(run.meta, 'pass', 'Frame challenged + doc/code gap named', ['frame', 'contradiction'])
      }
      if (!frameChallenge) return result(run.meta, 'fail', 'Compliance pass inside README frame', ['frame-taking'])
      return result(run.meta, 'inconclusive', 'Partial frame challenge')
    case 2:
      if (optionsMenu && !verdict) return result(run.meta, 'fail', 'Options menu without verdict', ['defer'])
      if (verdict && !optionsMenu) return result(run.meta, 'pass', 'Verdict without pure option menu', ['verdict'])
      return result(run.meta, 'inconclusive', 'Deference pattern mixed')
    case 3:
      if (history && frameChallenge) {
        return result(run.meta, 'pass', 'History read + effort drift named', ['history', 'drift'])
      }
      if (!history) return result(run.meta, 'fail', 'Status from docs only', ['no-history'])
      return result(run.meta, 'inconclusive', 'Effort audit partial')
    case 4:
      if (forward && docContradiction) {
        return result(run.meta, 'pass', 'Forward proposal grounded in observed assets', ['inventor'])
      }
      if (!forward) return result(run.meta, 'fail', 'Roadmap extrapolation only', ['no-inventor'])
      return result(run.meta, 'inconclusive', 'Forward move partial')
    default:
      return result(run.meta, 'inconclusive', `Unknown zoom-out probe ${probe}`)
  }
}

function grade(meta, run) {
  run.meta = meta
  switch (meta.skill) {
    case 'speed-daemon':
      return gradeSpeedDaemon(meta.probe, run)
    case 'flavored-md':
      return gradeFlavoredMd(meta.probe, run)
    case 'design-engineer':
      return gradeDesignEngineer(meta.probe, run)
    case 'shadcn-tailwind':
      return gradeShadcnTailwind(meta.probe, run)
    case 'saltintesta':
      return gradeSaltintesta(meta.probe, run)
    case 'zoom-out':
      return gradeZoomOut(meta.probe, run)
    default:
      return result(meta, 'inconclusive', `No grader for skill ${meta.skill}`)
  }
}

function listRunIds() {
  const runsDir = path.join(SCRATCHPAD, 'runs')
  if (!fs.existsSync(runsDir)) return []
  return fs.readdirSync(runsDir).filter((d) => parseRunId(d))
}

function summarize(results) {
  const ok = results.filter((r) => r.status === 'ok').length
  const fail = results.filter((r) => r.status === 'fail').length
  const inconclusive = results.filter((r) => r.status === 'inconclusive').length
  const skipped = results.filter((r) => r.status === 'skip').length
  return { ok, fail, inconclusive, skipped, total: results.length }
}

function printHuman(results) {
  const widths = { id: 12, mech: 12, claim: 10, status: 12 }
  console.log(`${'run-id'.padEnd(widths.id)} ${'mechanical'.padEnd(widths.mech)} ${'claim'.padEnd(widths.claim)} ${'status'.padEnd(widths.status)} notes`)
  for (const r of results) {
    console.log(
      `${r.id.padEnd(widths.id)} ${r.mechanical.padEnd(widths.mech)} ${String(r.servesClaim).padEnd(widths.claim)} ${r.status.padEnd(widths.status)} ${r.notes}`,
    )
  }
  const s = summarize(results)
  console.log('')
  console.log(`Summary: ${s.ok} ok, ${s.fail} fail, ${s.inconclusive} inconclusive, ${s.skipped} skipped (${s.total} graded)`)
  const owner = results.filter(
    (r) => (r.skill === 'saltintesta' || r.skill === 'zoom-out') && r.mechanical === 'pass' && r.status === 'ok',
  )
  if (owner.length) {
    console.log(`Owner queue: ${owner.map((r) => r.id).join(', ')} — mechanical pass still needs owner column`)
  }
}

function main() {
  if (!fs.existsSync(SCRATCHPAD)) {
    console.error(`scratchpad not found: ${SCRATCHPAD}`)
    process.exit(1)
  }

  const ids = RUN_ID ? [RUN_ID] : ALL ? listRunIds() : null
  if (!ids) {
    console.error('usage: grade-probe.js --all|--run-id ID [--scratchpad DIR] [--json]')
    process.exit(2)
  }

  const results = []
  for (const id of ids.sort()) {
    const meta = parseRunId(id)
    if (!meta) continue
    const run = readRun(id)
    if (!run.ok) {
      results.push({
        ...meta,
        mechanical: 'skip',
        servesClaim: 'skip',
        status: 'skip',
        notes: run.reason,
        signals: [],
      })
      continue
    }
    results.push(grade(meta, run))
  }

  if (AS_JSON) {
    console.log(JSON.stringify({ summary: summarize(results), results }, null, 2))
    return
  }
  printHuman(results)
}

main()
