# [Project or context name]

[One or two sentences: what this context is and why it exists.]

The shared language for this project. One word per concept, chosen on purpose, with the synonyms it replaces listed so they stop coming back. Agents read this so names in code, tests, commits and conversation all match — and so a sentence about this project can be short.

## Language

**[Term]**:
[One or two sentences. Define what it *is*, not what it does.]
_Avoid_: [the synonyms this replaces]

**[Term]**:
[Definition.]
_Avoid_: [synonyms]

<!-- Group under `###` subheadings once natural clusters appear. A flat list is fine while the set is small. -->

## Relationships

- [A **Term** holds many **Terms**.]
- [A **Term** carries one **Term** at a time.]

## Flagged ambiguities

<!-- The section that pays for itself. One word doing two jobs costs every agent a disambiguation on every read. -->

- ["word" meant both X and Y — resolved: X is **Term**, Y is **Term**. "word" is no longer used on its own.]
- ["word" and "word" were used interchangeably — resolved: collapsed into **Term**.]

---

<!--
Rules for this file:

- **Be opinionated.** Where several words exist for one concept, pick one and list the rest under `_Avoid_`.
- **Keep definitions tight.** One or two sentences. What it is, not what it does.
- **Only terms specific to this project.** Timeouts, error types, utility patterns and other general programming concepts don't belong even if this project uses them constantly. Before adding a term, ask whether it is unique to this context.
- **Grow it by incident.** Add a term the first time a word causes a misunderstanding. Written upfront in one sitting, it fills with general vocabulary.
- **Several contexts in one repo:** keep a `CONTEXT.md` per context beside its code, and a root `CONTEXT-MAP.md` listing them with how they relate.
-->
