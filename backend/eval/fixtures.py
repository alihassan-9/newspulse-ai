"""Labeled fixtures for evaluating the dedup and verification agents.

Each story carries a `gold` group id. Stories sharing a gold id describe the
same real-world event and SHOULD be clustered together; different ids should
stay apart. This lets us score clustering recall, purity, and verification.
"""

from app.models import Story


def _story(gold: str, title: str, source: str, cred: int) -> tuple[str, Story]:
    return gold, Story(
        category="National",
        title=title,
        summary="fixture",
        source=source,
        credibility=cred,
        link=f"https://example.com/{abs(hash(title))}",
        region="US",
        publishedAt=1_700_000_000_000,
    )


# gold group -> stories from independent publishers about the same event,
# plus singletons and a deliberate near-miss that must NOT merge into g1.
LABELED: list[tuple[str, Story]] = [
    # g1: same event, 3 independent sources -> should be Verified (3)
    _story("g1", "Supreme Court rules on major abortion case", "Reuters", 99),
    _story("g1", "Supreme Court issues landmark abortion ruling", "BBC", 97),
    _story("g1", "Justices decide pivotal abortion case at Supreme Court", "NPR", 96),
    # g2: same event, 2 sources -> Verified (2)
    _story("g2", "Apple unveils new iPhone with AI features", "CNBC", 93),
    _story("g2", "Apple launches new iPhone packed with AI", "The Guardian", 95),
    # singletons -> Single source
    _story("s1", "Local bakery wins national award", "People", 90),
    _story("s2", "Stock markets rise on strong jobs data", "CNBC", 93),
    # near-miss: shares only "supreme","court" with g1 -> must stay separate
    _story("n1", "Supreme Court cafeteria menu changes for summer", "ABC", 95),
]


def clustering_fixture() -> tuple[list[Story], dict[str, set[str]]]:
    stories = [s for _, s in LABELED]
    gold: dict[str, set[str]] = {}
    for gid, s in LABELED:
        gold.setdefault(gid, set()).add(s.title)
    return stories, gold


def dedup_fixture() -> tuple[list[Story], int]:
    """Same headline repeated (syndication) should collapse to one."""
    base = clustering_fixture()[0]
    dupe = base[0].model_copy()  # exact repeat of the first title
    stories = base + [dupe]
    expected_unique = len(base)  # the duplicate is removed
    return stories, expected_unique
