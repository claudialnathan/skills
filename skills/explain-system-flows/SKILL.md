---
name: explain-system-flows
description: Use when explaining how code, features, integrations, or system workflows actually work; writing internal Markdown documentation with Mermaid; or correcting explanations that are jargon-heavy, vague, or oversimplified for a technically capable reader.
---

# Explain System Flows

Translate the terminology; preserve the mechanism. Write for a capable product/design engineer who understands development concepts but lacks some vocabulary. Make the system understandable without making it less accurate.

## Investigate before explaining

- Identify the reader's question and one workflow or subsystem to explain. Use supplied scope; ask only when ambiguity changes the answer.
- Read the current implementation. Follow the entry point through calls, transformations, external services, storage, and the returned result. Inspect relevant configuration, types, and tests.
- Distinguish browser, application server, worker, database, external service, gateway, and model. Verify deployment location rather than inferring it from the stack.
- Separate current behavior, intended behavior, and proposed changes. Support design rationale with evidence; label inference.
- Without code access, state the limitation. Explain supplied material as a described flow, not a verified implementation. Keep missing details explicit.
- Stay within the requested documentation scope. Do not fix code, change infrastructure, publish, or commit without authorization.

## Establish the complete mechanism

For every meaningful step, establish the following before writing. Use `not shown` for unresolved facts; omit genuinely inapplicable fields.

| Required fact | What to establish |
| --- | --- |
| Trigger and actor | What starts the step; who executes it; where it runs. |
| Operation | Actual service and endpoint, SDK method, tool, or configured model. |
| Input → output | Relevant fields, formats, transformations, and identifiers. State which subset moves onward. |
| Handoff and timing | Who calls whom; what waits; what is queued, streamed, returned, or processed later. |
| State and outcome | What is stored, its location when known, status changes, and what success means to the caller. |
| Branches and limits | Conditions, permissions, reuse, failures, retries, or cleanup that change the result. |
| Evidence | Supporting repository-relative file paths and symbols. |

Keep a detail when removing it would change the reader's understanding of execution, data exposure, persistence, completion, failure, or where to investigate. Move supporting detail below the diagram rather than dropping it. Do not inventory every helper, import, or implementation line.

## Write the documentation

Use this order, adapting headings to existing docs:

1. **Purpose and boundary:** one or two sentences stating what this flow accomplishes, its start and end, and what it does not complete.
2. **Mermaid view:** the main flow with real actors, meaningful operations, and important branches.
3. **Mechanics:** a short numbered walkthrough or compact table covering the required facts. Put exact methods, fields, models, and configuration here when they would crowd the diagram.
4. **Important limits:** outcome-changing failures and unresolved behavior. Distinguish an explicit response from an uncaught exception. State retries or rollback only when verified.
5. **Source map:** associate important steps with files and symbols, not just a general list of files.

Explain what happens before naming unfamiliar terminology: “The server returns without waiting for the worker to finish indexing; this is background processing.” Keep useful technical terms and actual product names. Give each actor one consistent name. Use concrete verbs such as sends, parses, validates, extracts, stores, routes, and returns.

Replace “AI processes the website” with the verified operation and data: “The server calls `firecrawl.scrape(url, { formats: ['markdown'] })`. It passes the returned Markdown and optional title to `gateway.generateObject(...)`, which returns `title`, `description`, and `features`.” Treat this as a wording example, not evidence about the user's app.

Distinguish a hosting platform from a runtime, a gateway from a model, and generated content from downstream ingestion or indexing. A service name in a prompt is not proof of a connection. Introduce analogies only when requested or when literal wording is insufficient; keep the real mechanism alongside them.

## Draw Mermaid accurately

- Use `sequenceDiagram` for calls, responses, payloads, and background handoffs; `flowchart TD` for decisions and branches; `stateDiagram-v2` for lifecycles.
- Name real actors or operations in nodes. Label arrows with actions or transferred data; show returns separately when they matter.
- Show call direction from code. If the application receives a result and forwards it, show the application between the services. A temporal dependency is not a direct service-to-service call.
- Keep the synchronous request separate from independent background work. Mark queue boundaries and the caller's completion point explicitly. Distinguish “does not wait for completion” from “always finishes before the worker”: independent execution does not guarantee that ordering.
- Use one abstraction level and one workflow per diagram. Split dense views into an overview and focused details; do not impose a node limit that erases important mechanics.
- Use quoted labels and simple syntax. Avoid decorative icons, HTML labels, custom configuration, and ASCII substitutes. Render or parse with available tooling; otherwise report syntax as unverified. Diagramming does not require installing a tool.

## Completion check

- Trace every box, arrow, branch, and prose claim back to evidence.
- Check service identities, exact operations, data subsets, state changes, timing, and success semantics across the diagram and walkthrough.
- Check that malformed input, thrown errors, retries, and partial failure are not silently converted into cleaner behavior.
- Confirm that the reader can explain who does what, with which data, what happens next, and where to find it in code.
- Preserve complexity in the mechanism; reduce jargon and irrelevant breadth in the delivery.
