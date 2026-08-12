# Out of scope

Things this repository has decided **not** to do, and why. One file per decision, named for the thing being declined.

This exists because `git log` can't hold it. History records what changed, in the order it changed; a standing "no" ends up buried under everything shipped since, and there is nowhere to look it up. A refusal has to stay findable for as long as the reasoning holds, so it gets its own file.

The bar for a file here: the thing is **plausible enough to be proposed again**. A decision nobody would re-raise doesn't need a record.

## Shape

```md
# <The thing, stated as what won't happen>

<One or two sentences: what was proposed, and the decision.>

## Why this is out of scope

<The reasoning, in enough detail that it can be argued with rather than just obeyed.>

## What would change this

<The condition that would make it worth reconsidering — a spec revision, a client behaviour, a cost that stops being real. A refusal with no reopening condition is either permanent or unexamined; say which.>
```

Something declined *for now* rather than for good is a **Parked** row in `TASKS.md`. The split: parked items are waiting, out-of-scope items are answered.
