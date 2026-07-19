"""Runnable eval harness for the newsroom agents.

Run:  python -m eval.run_eval          (from the backend/ directory)
Exits non-zero if any hard check fails, so it can gate CI.
"""

import asyncio
import sys

from app.agents.ingestion import IngestionAgent
from app.agents.verification import DuplicateDetectionAgent, VerificationAgent
from app.util import no_dash
from eval.fixtures import clustering_fixture, dedup_fixture

PASS, FAIL, SKIP = "PASS", "FAIL", "SKIP"
results: list[tuple[str, str, str]] = []


def record(name: str, ok: bool, detail: str = "") -> None:
    results.append((name, PASS if ok else FAIL, detail))


# ---------------------------------------------------------------- unit evals
def eval_no_dash() -> None:
    cases = ["Trump — Carroll case", "France – Spain semi-final", "no dashes here"]
    bad = [c for c in cases if "—" in no_dash(c) or "–" in no_dash(c)]
    record("no_dash removes em/en dashes", not bad, f"{len(bad)} leftover")


def eval_dedup() -> None:
    stories, expected = dedup_fixture()
    unique = DuplicateDetectionAgent().run(stories)
    record(
        "dedup removes exact-title repeats",
        len(unique) == expected,
        f"got {len(unique)}, expected {expected}",
    )


def eval_clustering() -> None:
    stories, gold = clustering_fixture()
    events = VerificationAgent().run(stories)
    title_to_event = {}
    for ev in events:
        titles = {s.title for s in ev.stories}
        for t in titles:
            title_to_event[t] = titles

    recalls, purities = [], []
    for _, titles in gold.items():
        lead = next(iter(titles))
        produced = title_to_event.get(lead, {lead})
        inter = len(titles & produced)
        recalls.append(inter / len(titles))
        purities.append(inter / len(produced))
    recall = sum(recalls) / len(recalls)
    purity = sum(purities) / len(purities)

    # verification accuracy: multi-source gold groups must be verified, others not
    verified_by_title = {s.title: ev.verified for ev in events for s in ev.stories}
    correct = 0
    for _, titles in gold.items():
        expect_verified = len(titles) >= 2
        got = all(verified_by_title.get(t) == expect_verified for t in titles)
        correct += 1 if got else 0
    verif_acc = correct / len(gold)

    detail = f"recall={recall:.2f} purity={purity:.2f} verify_acc={verif_acc:.2f} events={len(events)}"
    record("clustering recall >= 0.90", recall >= 0.90, detail)
    record("clustering purity >= 0.90 (no over-merge)", purity >= 0.90, detail)
    record("verification accuracy == 1.00", verif_acc == 1.0, detail)


# ----------------------------------------------------------------- live eval
async def eval_live_smoke() -> None:
    try:
        stories = await IngestionAgent().run()
    except Exception as exc:
        results.append(("live ingestion smoke", SKIP, f"network: {exc}"))
        return
    if not stories:
        results.append(("live ingestion smoke", SKIP, "no items (offline?)"))
        return

    record("live: >= 50 articles", len(stories) >= 50, f"{len(stories)} items")
    record("live: >= 3 publishers", len({s.source for s in stories}) >= 3, "")
    record("live: no dashes in titles", not any("—" in s.title or "–" in s.title for s in stories), "")
    record("live: every story has title+link", all(s.title and s.link for s in stories), "")

    unique = DuplicateDetectionAgent().run(stories)
    events = VerificationAgent().run(unique)
    record("live: events produced", len(events) > 0, f"{len(events)} events")
    record("live: no event has empty sources", all(e.sources for e in events), "")
    record(
        "live: verified => 2+ sources",
        all(e.sourceCount >= 2 for e in events if e.verified),
        f"{sum(1 for e in events if e.verified)} verified",
    )


def main() -> int:
    eval_no_dash()
    eval_dedup()
    eval_clustering()
    asyncio.run(eval_live_smoke())

    print("\n=== NewsPulse Agent Eval ===")
    width = max(len(n) for n, _, _ in results)
    for name, verdict, detail in results:
        print(f"  [{verdict}] {name.ljust(width)}  {detail}")
    failed = [r for r in results if r[1] == FAIL]
    passed = sum(1 for r in results if r[1] == PASS)
    skipped = sum(1 for r in results if r[1] == SKIP)
    print(f"\n  {passed} passed, {len(failed)} failed, {skipped} skipped")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
