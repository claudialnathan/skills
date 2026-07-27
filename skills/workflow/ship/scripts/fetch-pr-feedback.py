#!/usr/bin/env python3
"""Fetch a read-only, current-head inventory for a GitHub pull request."""

from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import sys
from datetime import datetime, timezone
from typing import Any


def run_gh(*args: str) -> Any:
    command = ["gh", *args]
    result = subprocess.run(command, check=False, capture_output=True, text=True)
    if result.returncode != 0:
        detail = result.stderr.strip() or result.stdout.strip()
        raise RuntimeError(f"{' '.join(command)} failed: {detail}")
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError as error:
        raise RuntimeError(f"{' '.join(command)} returned invalid JSON") from error


def paginated_rest(endpoint: str) -> list[Any]:
    pages = run_gh(
        "api",
        "--paginate",
        "--slurp",
        "-H",
        "Accept: application/vnd.github+json",
        endpoint,
    )
    if not isinstance(pages, list):
        raise RuntimeError(f"unexpected paginated response for {endpoint}")
    flattened: list[Any] = []
    for page in pages:
        if isinstance(page, list):
            flattened.extend(page)
        else:
            flattened.append(page)
    return flattened


def repository_name(explicit: str | None) -> str:
    if explicit:
        return explicit
    result = run_gh("repo", "view", "--json", "nameWithOwner")
    return str(result["nameWithOwner"])


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
                "headRefName,headRefOid,baseRefName,reviewDecision"
            ),
        ]
    )
    result = run_gh(*args)
    if not isinstance(result, dict):
        raise RuntimeError("unexpected pull-request response")
    return result


def check_runs(owner: str, name: str, sha: str) -> list[dict[str, Any]]:
    pages = paginated_rest(
        f"repos/{owner}/{name}/commits/{sha}/check-runs?per_page=100"
    )
    runs: list[dict[str, Any]] = []
    for page in pages:
        if not isinstance(page, dict):
            continue
        for run in page.get("check_runs", []):
            output = run.get("output") or {}
            annotation_count = int(output.get("annotations_count") or 0)
            annotations: list[Any] = []
            if annotation_count:
                annotations = paginated_rest(
                    f"repos/{owner}/{name}/check-runs/{run['id']}/annotations"
                    "?per_page=100"
                )
            runs.append(
                {
                    "id": run.get("id"),
                    "name": run.get("name"),
                    "status": run.get("status"),
                    "conclusion": run.get("conclusion"),
                    "startedAt": run.get("started_at"),
                    "completedAt": run.get("completed_at"),
                    "detailsUrl": run.get("details_url"),
                    "app": (run.get("app") or {}).get("slug"),
                    "output": {
                        "title": output.get("title"),
                        "summary": output.get("summary"),
                        "text": output.get("text"),
                        "annotationsCount": annotation_count,
                    },
                    "annotations": annotations,
                }
            )
    return sorted(runs, key=lambda item: (str(item["name"]), int(item["id"] or 0)))


def commit_statuses(owner: str, name: str, sha: str) -> dict[str, Any]:
    pages = paginated_rest(
        f"repos/{owner}/{name}/commits/{sha}/status?per_page=100"
    )
    statuses = []
    combined_state = None
    for page in pages:
        if not isinstance(page, dict):
            continue
        combined_state = combined_state or page.get("state")
        for status in page.get("statuses", []):
            statuses.append(
                {
                    "id": status.get("id"),
                    "context": status.get("context"),
                    "state": status.get("state"),
                    "description": status.get("description"),
                    "targetUrl": status.get("target_url"),
                    "createdAt": status.get("created_at"),
                    "updatedAt": status.get("updated_at"),
                }
            )
    return {
        "state": combined_state,
        "statuses": sorted(
            statuses, key=lambda item: (str(item["context"]), int(item["id"] or 0))
        ),
    }


def deployments(owner: str, name: str, sha: str) -> list[dict[str, Any]]:
    items = paginated_rest(
        f"repos/{owner}/{name}/deployments?sha={sha}&per_page=100"
    )
    results: list[dict[str, Any]] = []
    for deployment in items:
        if not isinstance(deployment, dict):
            continue
        statuses = paginated_rest(
            f"repos/{owner}/{name}/deployments/{deployment['id']}/statuses"
            "?per_page=100"
        )
        normalized_statuses = []
        for status in statuses:
            if not isinstance(status, dict):
                continue
            normalized_statuses.append(
                {
                    "id": status.get("id"),
                    "state": status.get("state"),
                    "environment": status.get("environment"),
                    "environmentUrl": status.get("environment_url"),
                    "logUrl": status.get("log_url"),
                    "description": status.get("description"),
                    "createdAt": status.get("created_at"),
                    "updatedAt": status.get("updated_at"),
                }
            )
        normalized_statuses.sort(
            key=lambda item: (str(item["createdAt"]), int(item["id"] or 0))
        )
        results.append(
            {
                "id": deployment.get("id"),
                "sha": deployment.get("sha"),
                "ref": deployment.get("ref"),
                "task": deployment.get("task"),
                "environment": deployment.get("environment"),
                "originalEnvironment": deployment.get("original_environment"),
                "transientEnvironment": deployment.get("transient_environment"),
                "productionEnvironment": deployment.get("production_environment"),
                "createdAt": deployment.get("created_at"),
                "updatedAt": deployment.get("updated_at"),
                "statuses": normalized_statuses,
                "latestStatus": normalized_statuses[-1] if normalized_statuses else None,
            }
        )
    return sorted(results, key=lambda item: int(item["id"] or 0))


def remaining_thread_comments(thread_id: str, cursor: str) -> list[dict[str, Any]]:
    query = """
query($id:ID!,$cursor:String!) {
  node(id:$id) {
    ... on PullRequestReviewThread {
      comments(first:100,after:$cursor) {
        nodes {
          id
          databaseId
          author { login }
          body
          createdAt
          updatedAt
          url
        }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
}
"""
    comments: list[dict[str, Any]] = []
    next_cursor: str | None = cursor
    while next_cursor:
        result = run_gh(
            "api",
            "graphql",
            "-f",
            f"query={query}",
            "-F",
            f"id={thread_id}",
            "-F",
            f"cursor={next_cursor}",
        )
        connection = result["data"]["node"]["comments"]
        comments.extend(connection["nodes"])
        page_info = connection["pageInfo"]
        next_cursor = page_info["endCursor"] if page_info["hasNextPage"] else None
    return comments


def review_threads(owner: str, name: str, number: int) -> list[dict[str, Any]]:
    query = """
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
          startLine
          originalStartLine
          comments(first:100) {
            nodes {
              id
              databaseId
              author { login }
              body
              createdAt
              updatedAt
              url
            }
            pageInfo { hasNextPage endCursor }
          }
        }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
}
"""
    cursor: str | None = None
    threads: list[dict[str, Any]] = []
    while True:
        args = [
            "api",
            "graphql",
            "-f",
            f"query={query}",
            "-F",
            f"owner={owner}",
            "-F",
            f"name={name}",
            "-F",
            f"number={number}",
        ]
        if cursor:
            args.extend(["-F", f"cursor={cursor}"])
        result = run_gh(*args)
        connection = result["data"]["repository"]["pullRequest"]["reviewThreads"]
        for thread in connection["nodes"]:
            comments = thread.get("comments") or {}
            thread_comments = comments.get("nodes", [])
            comments_page_info = comments.get("pageInfo") or {}
            if comments_page_info.get("hasNextPage"):
                thread_comments.extend(
                    remaining_thread_comments(
                        str(thread["id"]), str(comments_page_info["endCursor"])
                    )
                )
            thread["comments"] = thread_comments
            threads.append(thread)
        page_info = connection["pageInfo"]
        if not page_info["hasNextPage"]:
            break
        cursor = page_info["endCursor"]
    return sorted(threads, key=lambda item: str(item["id"]))


def normalize_comment(comment: dict[str, Any]) -> dict[str, Any]:
    user = comment.get("user") or {}
    return {
        "id": comment.get("id"),
        "author": user.get("login"),
        "body": comment.get("body"),
        "createdAt": comment.get("created_at"),
        "updatedAt": comment.get("updated_at"),
        "url": comment.get("html_url"),
    }


def normalize_review(review: dict[str, Any]) -> dict[str, Any]:
    user = review.get("user") or {}
    return {
        "id": review.get("id"),
        "author": user.get("login"),
        "state": review.get("state"),
        "body": review.get("body"),
        "commitId": review.get("commit_id"),
        "submittedAt": review.get("submitted_at"),
        "url": review.get("html_url"),
    }


def normalize_inline_comment(comment: dict[str, Any]) -> dict[str, Any]:
    user = comment.get("user") or {}
    return {
        "id": comment.get("id"),
        "nodeId": comment.get("node_id"),
        "reviewId": comment.get("pull_request_review_id"),
        "inReplyToId": comment.get("in_reply_to_id"),
        "author": user.get("login"),
        "body": comment.get("body"),
        "path": comment.get("path"),
        "line": comment.get("line"),
        "originalLine": comment.get("original_line"),
        "startLine": comment.get("start_line"),
        "originalStartLine": comment.get("original_start_line"),
        "commitId": comment.get("commit_id"),
        "originalCommitId": comment.get("original_commit_id"),
        "createdAt": comment.get("created_at"),
        "updatedAt": comment.get("updated_at"),
        "url": comment.get("html_url"),
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Fetch all GitHub-visible PR feedback for the current head."
    )
    parser.add_argument("--repo", help="Repository in owner/name form.")
    parser.add_argument("--pr", help="PR number or URL; defaults to the current branch.")
    parser.add_argument(
        "--compact", action="store_true", help="Emit compact JSON instead of indented JSON."
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        repo = repository_name(args.repo)
        owner, name = repo.split("/", 1)
        pr = pr_details(repo, args.pr)
        number = int(pr["number"])
        sha = str(pr["headRefOid"])

        inventory: dict[str, Any] = {
            "repository": repo,
            "pullRequest": pr,
            "checkRuns": check_runs(owner, name, sha),
            "commitStatuses": commit_statuses(owner, name, sha),
            "deployments": deployments(owner, name, sha),
            "conversationComments": [
                normalize_comment(item)
                for item in paginated_rest(
                    f"repos/{owner}/{name}/issues/{number}/comments?per_page=100"
                )
            ],
            "submittedReviews": [
                normalize_review(item)
                for item in paginated_rest(
                    f"repos/{owner}/{name}/pulls/{number}/reviews?per_page=100"
                )
            ],
            "inlineReviewComments": [
                normalize_inline_comment(item)
                for item in paginated_rest(
                    f"repos/{owner}/{name}/pulls/{number}/comments?per_page=100"
                )
            ],
            "reviewThreads": review_threads(owner, name, number),
        }
        canonical = json.dumps(
            inventory, ensure_ascii=False, sort_keys=True, separators=(",", ":")
        )
        result = {
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "inventoryFingerprint": hashlib.sha256(canonical.encode()).hexdigest(),
            **inventory,
        }
        if args.compact:
            print(json.dumps(result, ensure_ascii=False, sort_keys=True))
        else:
            print(json.dumps(result, ensure_ascii=False, indent=2, sort_keys=True))
        return 0
    except (KeyError, RuntimeError, ValueError) as error:
        print(f"fetch-pr-feedback: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
