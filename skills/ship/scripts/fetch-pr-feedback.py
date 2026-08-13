#!/usr/bin/env python3
"""Read-only current-head feedback inventory for a GitHub pull request.

Default output is a triage digest: counts, ids, states, and body snippets, sized
to be read in full by an agent. Fetch one item's untruncated text with --show,
compare two snapshots with --fingerprint, and dump every raw field with --full.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import sys
import time
from datetime import datetime, timezone
from typing import Any

GH_TIMEOUT = 60
SNIPPET_CHARS = 240
ANNOTATION_CHARS = 300
MAX_ANNOTATIONS = 50
MAX_COMMENTS = 100
MAX_THREADS = 60
TRANSIENT_HINTS = (
    "rate limit",
    "secondary rate",
    "502",
    "503",
    "504",
    "timed out",
    "timeout",
    "connection reset",
    "eof",
)
FAILED_CONCLUSIONS = {
    "failure",
    "timed_out",
    "cancelled",
    "action_required",
    "startup_failure",
    "stale",
}
SETTLED_DEPLOY_STATES = {"success", "inactive"}


class GhError(RuntimeError):
    """A gh invocation failed after its retry."""


def run_gh(*args: str) -> Any:
    command = ["gh", *args]
    last = ""
    for attempt in range(2):
        try:
            result = subprocess.run(
                command, check=False, capture_output=True, text=True, timeout=GH_TIMEOUT
            )
        except subprocess.TimeoutExpired:
            last = f"no response in {GH_TIMEOUT}s"
        else:
            if result.returncode == 0:
                try:
                    return json.loads(result.stdout)
                except json.JSONDecodeError as error:
                    raise GhError(f"{' '.join(command)} returned invalid JSON") from error
            last = result.stderr.strip() or result.stdout.strip()
        if attempt == 0 and any(hint in last.lower() for hint in TRANSIENT_HINTS):
            time.sleep(3)
            continue
        break
    raise GhError(f"{' '.join(command)} failed: {last}")


def paginated_rest(endpoint: str) -> list[Any]:
    pages = run_gh(
        "api", "--paginate", "--slurp", "-H", "Accept: application/vnd.github+json", endpoint
    )
    if not isinstance(pages, list):
        raise GhError(f"unexpected paginated response for {endpoint}")
    flattened: list[Any] = []
    for page in pages:
        flattened.extend(page) if isinstance(page, list) else flattened.append(page)
    return flattened


def snippet(text: str | None, limit: int = SNIPPET_CHARS) -> str | None:
    if not text:
        return None
    collapsed = " ".join(str(text).split())
    if len(collapsed) <= limit:
        return collapsed
    return f"{collapsed[:limit]}… [+{len(collapsed) - limit} chars]"


def digest(text: str | None) -> str:
    return hashlib.sha256((text or "").encode()).hexdigest()[:12]


def fingerprint(payload: Any) -> str:
    canonical = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonical.encode()).hexdigest()[:16]


def repository_name(explicit: str | None) -> str:
    if explicit:
        return explicit
    return str(run_gh("repo", "view", "--json", "nameWithOwner")["nameWithOwner"])


def pr_details(repo: str, pr: str | None) -> dict[str, Any]:
    args = ["pr", "view"]
    if pr:
        args.append(pr)
    args.extend(
        [
            "--repo",
            repo,
            "--json",
            (
                "number,url,state,isDraft,mergeable,mergeStateStatus,autoMergeRequest,"
                "headRefName,headRefOid,baseRefName,reviewDecision,mergedAt"
            ),
        ]
    )
    result = run_gh(*args)
    if not isinstance(result, dict):
        raise GhError("unexpected pull-request response")
    return result


def check_runs(owner: str, name: str, sha: str) -> tuple[list[dict[str, Any]], int]:
    """Return the newest run per check name, plus the count of superseded re-runs.

    GitHub keeps every re-run of a check against a SHA. A stale failure from a run
    that has since been re-run green is not a finding, so only the newest survives.
    """
    pages = paginated_rest(f"repos/{owner}/{name}/commits/{sha}/check-runs?per_page=100")
    newest: dict[tuple[str, str], dict[str, Any]] = {}
    superseded = 0
    for page in pages:
        if not isinstance(page, dict):
            continue
        for run in page.get("check_runs", []):
            key = (str(run.get("name")), str((run.get("app") or {}).get("slug")))
            rank = (str(run.get("started_at") or ""), int(run.get("id") or 0))
            current = newest.get(key)
            if current is None:
                newest[key] = run
                continue
            superseded += 1
            if rank > (str(current.get("started_at") or ""), int(current.get("id") or 0)):
                newest[key] = run

    runs: list[dict[str, Any]] = []
    for run in newest.values():
        output = run.get("output") or {}
        annotations: list[Any] = []
        if int(output.get("annotations_count") or 0):
            annotations = paginated_rest(
                f"repos/{owner}/{name}/check-runs/{run['id']}/annotations?per_page=100"
            )
        runs.append({**run, "output": output, "annotations": annotations})
    runs.sort(key=lambda item: (str(item.get("name")), int(item.get("id") or 0)))
    return runs, superseded


def commit_statuses(owner: str, name: str, sha: str) -> dict[str, Any]:
    pages = paginated_rest(f"repos/{owner}/{name}/commits/{sha}/status?per_page=100")
    statuses: list[dict[str, Any]] = []
    combined = None
    for page in pages:
        if not isinstance(page, dict):
            continue
        combined = combined or page.get("state")
        statuses.extend(page.get("statuses", []))
    return {"state": combined, "statuses": statuses}


def deployments(owner: str, name: str, sha: str) -> list[dict[str, Any]]:
    results: list[dict[str, Any]] = []
    for deployment in paginated_rest(f"repos/{owner}/{name}/deployments?sha={sha}&per_page=100"):
        if not isinstance(deployment, dict):
            continue
        statuses = [
            status
            for status in paginated_rest(
                f"repos/{owner}/{name}/deployments/{deployment['id']}/statuses?per_page=100"
            )
            if isinstance(status, dict)
        ]
        statuses.sort(key=lambda item: (str(item.get("created_at")), int(item.get("id") or 0)))
        results.append(
            {**deployment, "statuses": statuses, "latestStatus": statuses[-1] if statuses else None}
        )
    return sorted(results, key=lambda item: int(item.get("id") or 0))


THREAD_QUERY = """
query($owner:String!,$name:String!,$number:Int!,$cursor:String) {
  repository(owner:$owner,name:$name) {
    pullRequest(number:$number) {
      reviewThreads(first:100,after:$cursor) {
        nodes {
          id
          isResolved
          isOutdated
          path
          line
          originalLine
          comments(last:1) {
            totalCount
            nodes { id author { login } body createdAt url }
          }
        }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
}
"""


def review_threads(owner: str, name: str, number: int) -> list[dict[str, Any]]:
    threads: list[dict[str, Any]] = []
    cursor: str | None = None
    while True:
        args = [
            "api",
            "graphql",
            "-f",
            f"query={THREAD_QUERY}",
            "-F",
            f"owner={owner}",
            "-F",
            f"name={name}",
            "-F",
            f"number={number}",
        ]
        if cursor:
            args.extend(["-F", f"cursor={cursor}"])
        connection = run_gh(*args)["data"]["repository"]["pullRequest"]["reviewThreads"]
        threads.extend(connection["nodes"])
        if not connection["pageInfo"]["hasNextPage"]:
            break
        cursor = connection["pageInfo"]["endCursor"]
    return sorted(threads, key=lambda item: str(item["id"]))


def collect(owner: str, name: str, pr: dict[str, Any], sha: str) -> dict[str, Any]:
    number = int(pr["number"])
    runs, superseded = check_runs(owner, name, sha)
    return {
        "checkRuns": runs,
        "supersededRunCount": superseded,
        "commitStatuses": commit_statuses(owner, name, sha),
        "deployments": deployments(owner, name, sha),
        "conversationComments": paginated_rest(
            f"repos/{owner}/{name}/issues/{number}/comments?per_page=100"
        ),
        "submittedReviews": paginated_rest(
            f"repos/{owner}/{name}/pulls/{number}/reviews?per_page=100"
        ),
        "reviewThreads": review_threads(owner, name, number),
    }


def summarize_checks(runs: list[dict[str, Any]]) -> dict[str, Any]:
    pending, failing, skipped, advisory, annotations = [], [], [], [], []
    passing = 0
    for run in runs:
        output = run["output"]
        name = run.get("name")
        conclusion = run.get("conclusion")
        entry = {"id": run.get("id"), "name": name, "app": (run.get("app") or {}).get("slug")}
        if run.get("status") != "completed":
            pending.append({**entry, "status": run.get("status")})
        elif conclusion in FAILED_CONCLUSIONS:
            failing.append({**entry, "conclusion": conclusion, "url": run.get("details_url")})
        elif conclusion in {"skipped", "neutral"}:
            skipped.append({**entry, "conclusion": conclusion})
        else:
            passing += 1
        has_text = any(output.get(key) for key in ("title", "summary", "text"))
        if has_text or output.get("annotations_count"):
            advisory.append(
                {
                    **entry,
                    "conclusion": conclusion,
                    "title": snippet(output.get("title"), 120),
                    "summary": snippet(output.get("summary")),
                    "textChars": len(output.get("text") or ""),
                    "annotationsCount": int(output.get("annotations_count") or 0),
                }
            )
        for annotation in run["annotations"]:
            if not isinstance(annotation, dict):
                continue
            annotations.append(
                {
                    "check": name,
                    "level": annotation.get("annotation_level"),
                    "path": annotation.get("path"),
                    "line": annotation.get("start_line"),
                    "title": snippet(annotation.get("title"), 120),
                    "message": snippet(annotation.get("message"), ANNOTATION_CHARS),
                }
            )

    deduped: dict[str, dict[str, Any]] = {}
    for annotation in annotations:
        key = fingerprint(annotation)
        existing = deduped.get(key)
        if existing:
            existing["occurrences"] += 1
        else:
            deduped[key] = {**annotation, "occurrences": 1}
    annotations = list(deduped.values())

    return {
        "pending": pending,
        "failing": failing,
        "skipped": skipped,
        "passingCount": passing,
        "withOutput": advisory,
        "annotations": annotations[:MAX_ANNOTATIONS],
        "annotationsOmitted": max(0, len(annotations) - MAX_ANNOTATIONS),
    }


def summarize_threads(threads: list[dict[str, Any]]) -> dict[str, Any]:
    unresolved, resolved, outdated = [], 0, 0
    for thread in threads:
        if thread.get("isResolved"):
            resolved += 1
            continue
        if thread.get("isOutdated"):
            outdated += 1
        latest = (thread.get("comments") or {}).get("nodes") or [{}]
        comment = latest[-1]
        unresolved.append(
            {
                "id": thread.get("id"),
                "path": thread.get("path"),
                "line": thread.get("line") or thread.get("originalLine"),
                "isOutdated": bool(thread.get("isOutdated")),
                "commentCount": (thread.get("comments") or {}).get("totalCount"),
                "author": (comment.get("author") or {}).get("login"),
                "latest": snippet(comment.get("body")),
                "url": comment.get("url"),
            }
        )
    return {
        "unresolved": unresolved[:MAX_THREADS],
        "unresolvedOmitted": max(0, len(unresolved) - MAX_THREADS),
        "unresolvedOutdatedCount": outdated,
        "resolvedCount": resolved,
    }


def build_digest(repo: str, pr: dict[str, Any], sha: str, raw: dict[str, Any]) -> dict[str, Any]:
    checks = summarize_checks(raw["checkRuns"])
    threads = summarize_threads(raw["reviewThreads"])
    statuses = [
        {
            "context": status.get("context"),
            "state": status.get("state"),
            "description": snippet(status.get("description"), 120),
        }
        for status in raw["commitStatuses"]["statuses"]
        if status.get("state") != "success"
    ]
    deploys = [
        {
            "environment": deployment.get("environment"),
            "state": (deployment.get("latestStatus") or {}).get("state"),
            "url": (deployment.get("latestStatus") or {}).get("environment_url"),
            "description": snippet((deployment.get("latestStatus") or {}).get("description"), 120),
        }
        for deployment in raw["deployments"]
    ]
    reviews = [
        {
            "id": review.get("id"),
            "author": (review.get("user") or {}).get("login"),
            "state": review.get("state"),
            "commitId": review.get("commit_id"),
            "body": snippet(review.get("body")),
        }
        for review in raw["submittedReviews"]
        if review.get("state") != "COMMENTED" or review.get("body")
    ]
    comments = [
        {
            "id": comment.get("id"),
            "author": (comment.get("user") or {}).get("login"),
            "bodyHash": digest(comment.get("body")),
            "body": snippet(comment.get("body")),
            "url": comment.get("html_url"),
        }
        for comment in raw["conversationComments"]
    ]

    unsettled_deploys = [item for item in deploys if item["state"] not in SETTLED_DEPLOY_STATES]
    changes_requested = [item for item in reviews if item["state"] == "CHANGES_REQUESTED"]
    actionable = {
        "pending": [item["name"] for item in checks["pending"]],
        "failing": [item["name"] for item in checks["failing"]],
        "advisory": [
            [item["name"], digest(item["summary"]), item["annotationsCount"]]
            for item in checks["withOutput"]
        ],
        "annotations": [
            [item["check"], item["path"], item["line"], digest(item["message"])]
            for item in checks["annotations"]
        ],
        "threads": [[item["id"], digest(item["latest"])] for item in threads["unresolved"]],
        "reviewsRequestingChanges": [item["id"] for item in changes_requested],
        "statuses": [[item["context"], item["state"]] for item in statuses],
        "deployments": [[item["environment"], item["state"]] for item in unsettled_deploys],
    }

    return {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "mode": "digest",
        "repository": repo,
        "headSha": sha,
        "actionableFingerprint": fingerprint(actionable),
        "commentFingerprint": fingerprint([[item["id"], item["bodyHash"]] for item in comments]),
        "pullRequest": {
            "number": pr.get("number"),
            "url": pr.get("url"),
            "state": pr.get("state"),
            "merged": bool(pr.get("mergedAt")) or pr.get("state") == "MERGED",
            "isDraft": pr.get("isDraft"),
            "mergeable": pr.get("mergeable"),
            "mergeStateStatus": pr.get("mergeStateStatus"),
            "autoMergeEnabled": bool(pr.get("autoMergeRequest")),
            "reviewDecision": pr.get("reviewDecision"),
            "headRefName": pr.get("headRefName"),
            "baseRefName": pr.get("baseRefName"),
        },
        "checks": checks,
        "commitStatusState": raw["commitStatuses"]["state"],
        "nonSuccessStatuses": statuses,
        "deployments": deploys,
        "reviews": reviews,
        "threads": threads,
        "conversationComments": comments[-MAX_COMMENTS:],
        "conversationCommentsOmitted": max(0, len(comments) - MAX_COMMENTS),
        "counts": {
            "checksTotal": len(raw["checkRuns"]),
            "checksTerminal": len(raw["checkRuns"]) - len(checks["pending"]),
            "supersededRerunsIgnored": raw["supersededRunCount"],
            "blocking": (
                len(checks["pending"])
                + len(checks["failing"])
                + len(threads["unresolved"])
                + len(changes_requested)
                + len(unsettled_deploys)
                + len(statuses)
            ),
        },
        "allChecksTerminal": not checks["pending"],
        "hint": (
            "Read every checks.withOutput entry and annotation before judging a green check. "
            "Fetch untruncated text with --show check:<id>|comment:<id>|review:<id>|thread:<id>. "
            "Convergence requires two equal actionableFingerprint values; a changed "
            "commentFingerprint means re-read only the comment ids whose bodyHash moved. "
            "A deployment whose state is not success or inactive counts as blocking, "
            "including failure and error."
        ),
    }


def show_item(owner: str, name: str, number: int, target: str) -> int:
    kind, _, identifier = target.partition(":")
    if not identifier:
        raise GhError("--show expects kind:id, e.g. check:123 or thread:PRRT_x")
    if kind == "check":
        run = run_gh("api", f"repos/{owner}/{name}/check-runs/{identifier}")
        output = run.get("output") or {}
        print(f"# {run.get('name')} — {run.get('conclusion')}")
        for key in ("title", "summary", "text"):
            if output.get(key):
                print(f"\n## {key}\n{output[key]}")
        if int(output.get("annotations_count") or 0):
            for annotation in paginated_rest(
                f"repos/{owner}/{name}/check-runs/{identifier}/annotations?per_page=100"
            ):
                print(
                    f"\n- {annotation.get('annotation_level')} "
                    f"{annotation.get('path')}:{annotation.get('start_line')} "
                    f"{annotation.get('message')}"
                )
    elif kind == "comment":
        item = run_gh("api", f"repos/{owner}/{name}/issues/comments/{identifier}")
        print(f"# {(item.get('user') or {}).get('login')}\n\n{item.get('body')}")
    elif kind == "review":
        item = run_gh("api", f"repos/{owner}/{name}/pulls/{number}/reviews/{identifier}")
        print(f"# {(item.get('user') or {}).get('login')} — {item.get('state')}\n\n{item.get('body')}")
    elif kind == "thread":
        query = (
            "query($id:ID!){node(id:$id){... on PullRequestReviewThread{path line isResolved "
            "isOutdated comments(first:100){nodes{author{login} body createdAt url}}}}}"
        )
        node = run_gh("api", "graphql", "-f", f"query={query}", "-F", f"id={identifier}")["data"][
            "node"
        ]
        print(f"# {node.get('path')}:{node.get('line')} resolved={node.get('isResolved')}")
        for comment in node["comments"]["nodes"]:
            print(f"\n## {(comment.get('author') or {}).get('login')}\n{comment.get('body')}")
    else:
        raise GhError(f"unknown --show kind: {kind}")
    return 0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", help="Repository in owner/name form.")
    parser.add_argument("--pr", help="PR number or URL; defaults to the current branch.")
    parser.add_argument(
        "--fingerprint",
        action="store_true",
        help="Print only head SHA, fingerprints, and blocking counts (one short line of JSON).",
    )
    parser.add_argument(
        "--full", action="store_true", help="Dump every raw field instead of the digest."
    )
    parser.add_argument("--show", metavar="KIND:ID", help="Print one item's untruncated text.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        repo = repository_name(args.repo)
        owner, name = repo.split("/", 1)
        pr = pr_details(repo, args.pr)
        sha = str(pr["headRefOid"])
        if args.show:
            return show_item(owner, name, int(pr["number"]), args.show)

        raw = collect(owner, name, pr, sha)
        result = build_digest(repo, pr, sha, raw)
        if args.full:
            result = {**result, "mode": "full", "raw": raw}
        elif args.fingerprint:
            result = {
                key: result[key]
                for key in (
                    "generatedAt",
                    "headSha",
                    "actionableFingerprint",
                    "commentFingerprint",
                    "allChecksTerminal",
                    "counts",
                )
            }
        print(json.dumps(result, ensure_ascii=False, indent=2, sort_keys=True))
        return 0
    except (GhError, KeyError, ValueError) as error:
        print(f"fetch-pr-feedback: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
