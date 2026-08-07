# Behavioral and copy finish

The half of the finish pass that isn't about how a surface looks — what it does while waiting, failing or being typed into, how it announces itself, where its state lives, and how its words are set. The visual half is in [polish.md](polish.md).

## 1. Empty / loading / error states

Every list, every fetch, every user-facing dynamic surface needs all three:

```tsx
{state === "loading" && <Skeleton />}              // preserves layout, no spinner-jump
{state === "empty"   && <EmptyState … />}          // real message, suggested action
{state === "error"   && <ErrorState retry={…} />}  // recovery path, not just "Error"
{state === "ready"   && <List items={…} />}
```

Anti-pattern: a spinner where a skeleton would do. Spinners say "loading"; skeletons say "this is what will be here", which feels faster. The skeleton is for the cold-cache case only — when cached data exists, render it rather than a waiting state.

Disabled and read-only are different states and should look different. Disabled means "you can't do this now" — reduced opacity, `cursor-not-allowed`. Read-only means "this value is real but not yours to change" and should stay legible at full contrast.

## 2. `aria-live` on dynamic regions

Toasts, error banners and status messages announce to screen readers without stealing focus.

```tsx
<div role="status" aria-live="polite" aria-atomic="true">
  {message}
</div>

// Or for high-urgency errors:
<div role="alert" aria-live="assertive">
  {errorMessage}
</div>
```

**`polite`** queues; **`assertive`** interrupts. Default to `polite`.

## 3. Semantic input types

Mobile keyboards adapt to input type:

```tsx
<input type="email" autoComplete="email" />
<input type="tel" inputMode="numeric" autoComplete="tel" />
<input type="search" />
<input type="number" inputMode="decimal" />
```

`type` controls validation; `inputMode` controls the keyboard; `autoComplete` enables system fill. Combine all three for the best mobile experience.

## 4. Forms that don't fight the user

Most form frustration is self-inflicted — handlers that intercept behavior the browser already got right.

- **Never block paste** in `<input>` or `<textarea>`. Paste-blocking on confirm-email, password or one-time-code fields breaks password managers and 2FA, and it inconveniences careful users far more often than careless ones. Whatever the paste-blocking was meant to catch, validation catches better.
- **Preserve native Enter submission.** Enter submits a single-control form, or the last text control in a multi-control form. Don't add a global key handler that submits from intermediate fields. Inside a `<textarea>`, Enter inserts a newline and ⌘/Ctrl+Enter submits.
- **Keep the submit button enabled until the request starts.** A disabled submit hides *what* is incomplete — let the submit happen and let validation say so. Once the request is in flight, disable it and show a spinner while **keeping the original label**; swapping "Save" for "Saving…" resizes the button and says nothing the spinner didn't.
- **Accept free-form text, validate after.** Reformatting or rejecting mid-keystroke fights the user's typing; phone, card and date fields are the usual offenders.
- **Errors render inline next to their field**, and on submit focus moves to the first errored field.
- **Warn before navigating away with unsaved changes** — `beforeunload` for a hard navigation, the router's own guard for a soft one.
- **Trim leading and trailing whitespace only where it is non-semantic.** Text-expansion tools and mobile keyboards append a trailing space, so a field such as an email or a project slug may normalize it when its domain contract does. Never trim passwords, exact tokens, signatures, or user-authored content where whitespace can be meaningful.
- **`spellCheck={false}`** on emails, codes, usernames and anything else that isn't prose — red squiggles under a correct value read as an error.
- **Placeholders show the expected value or pattern**, never a restatement of the label. Prompt-style placeholders use `…` where it communicates continuation ("Search projects…"); exact patterns such as "name@company.com" don't acquire decorative punctuation.
- **No dead zones on checkboxes and radios.** The label and the control share one continuous hit target — wrap the input in the `<label>`, or wire `htmlFor`, so the whole row is clickable rather than just the 16px box.

```tsx
<form onSubmit={onSubmit}>
  <label htmlFor="email">Work email</label>
  <input
    id="email"
    type="email"
    autoComplete="email"
    spellCheck={false}
    placeholder="name@company.com"
    aria-invalid={Boolean(error)}
    aria-describedby={error ? "email-error" : undefined}
  />
  {error && <p id="email-error" role="alert">{error}</p>}

  <button type="submit" disabled={pending}>
    {pending && <Spinner />}
    Save
  </button>
</form>
```

## 5. `AlertDialog`, not `Dialog`, for destructive or irreversible actions

Delete, archive, charge, send, publish, unsubscribe — anything the user can't easily walk back. An alert dialog differs from a plain dialog in two ways: it requires an explicit confirm-or-cancel choice, with no dismiss-by-outside-click and no escape-to-dismiss without intent, and it announces with `role="alertdialog"` so screen readers convey urgency.

A regular dialog with a "Delete" button is wrong here: outside-click dismiss can swallow the intent at exactly the moment the user meant to confirm. Read the installed primitive's own API for the part names and props.

## 6. URL as state, links as navigation

If a view can be described — filter, tab, page, sort order, expanded panel, open detail — the URL should describe it. Deep-linking is the visible payoff; the real one is that refresh, back, forward and a pasted link all land on the same screen.

- Filters, tabs, pagination, sort and expanded panels live in the query string or the path, not only in component state.
- Back and forward restore **both the state and the scroll position**. Frameworks usually restore scroll on history navigation by default; verify it survives your own opt-outs and any virtualized list, where the restored offset can land in unrendered space.
- Navigation uses a real `<a>` or `<Link>` with an `href`. A `div` with an onClick that calls the router is not navigation: no Cmd/Ctrl-click, no middle-click, no open-in-new-tab, no link preview, no keyboard activation, nothing for a crawler.
- A `<button>` that navigates has the same defect in a nicer costume. If it goes somewhere it's a link; if it does something it's a button.

## 7. Tooltip timing — delay the first, then instant

A tooltip that opens instantly on every hover turns a toolbar into a flicker as the cursor crosses it. Delay the first tooltip in a group; once one is open its peers open instantly, and the group returns to delayed shortly after the pointer leaves.

Component libraries commonly ship this on a tooltip provider — a grouped open delay plus a close delay — and mark the instant case with a data attribute so the open animation can be skipped for it. Read the installed provider's props before wiring the values.

## 8. Typographic and locale micro-craft

- **Curly quotes in UI copy** — `’` for apostrophes, `“ ”` for quotations. Straight `'` and `"` are typewriter artifacts. Keep them straight only where the text is code, a copy-pasteable string, or user-generated content you shouldn't rewrite.
- **The single `…` character, never three periods.** Three periods space unevenly and can wrap across lines. Use it on menu items that open a follow-up ("Rename…", "Move to…") and on loading labels ("Loading…"); an item that acts immediately gets no ellipsis.
- **Non-breaking spaces where a wrap would orphan a unit** — `10&nbsp;MB`, `⌘&nbsp;K`, `Node&nbsp;22`, multi-word brand names. A shortcut lockup split across two lines is unreadable for the half-second before the eye reassembles it.
- **`translate="no"`** on brand names, code tokens, identifiers and keys. Auto-translation otherwise turns a product name into a common noun mid-sentence.
- **Dates, times and numbers go through `Intl`** — `Intl.DateTimeFormat`, `Intl.NumberFormat`, `Intl.RelativeTimeFormat` — never hand-assembled strings. Concatenation hardcodes one locale's separators, ordering and currency placement. When the value is server-rendered, pin a `timeZone` or format on one side only, or the hydration pass disagrees with the paint.
- **Front-load the message.** "Export ready" beats "Your export is complete and available for download"; the first two words carry it. Error states say what went wrong *and* what to do next; success messages are specific and brief ("Saved", not "Done").
