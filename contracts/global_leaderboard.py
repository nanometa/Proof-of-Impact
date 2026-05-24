import json
from genlayer import *


class GlobalLeaderboard(gl.Contract):
    """
    Global leaderboard for ProofOfImpact.
    Uses only GenLayer-supported types: TreeMap, str, u256, Address.
    Contributors list is stored as a JSON-encoded string to allow iteration.
    """

    # address -> cumulative score
    scores: TreeMap[str, u256]

    # JSON array of unique contributor addresses e.g. '["0xabc", "0xdef"]'
    contributors_json: str

    # Total number of unique contributors
    contributor_count: u256

    # Only the deployer (owner) can write scores
    owner: Address

    def __init__(self):
        self.owner = gl.message.sender_address
        self.contributors_json = "[]"
        self.contributor_count = u256(0)

    # ─────────────────────────────────────────────
    # WRITE
    # ─────────────────────────────────────────────

    @gl.public.write
    def record_score(self, contributor: str, score: u256) -> None:
        """
        Add `score` points to a contributor.
        Only callable by the contract owner.
        """
        if gl.message.sender_address != self.owner:
            raise gl.vm.UserError("only owner can record scores")

        contributor = contributor.lower()
        current = int(self.scores.get(contributor, u256(0)))

        if current == 0:
            # First time — add to contributors list
            contributors = json.loads(self.contributors_json)
            contributors.append(contributor)
            self.contributors_json = json.dumps(contributors)
            self.contributor_count = u256(int(self.contributor_count) + 1)

        self.scores[contributor] = u256(current + int(score))

    @gl.public.write
    def set_score(self, contributor: str, score: u256) -> None:
        """
        Overwrite a contributor's score directly (owner only).
        Useful for syncing from the main POI contract.
        """
        if gl.message.sender_address != self.owner:
            raise gl.vm.UserError("only owner can set scores")

        contributor = contributor.lower()
        current = int(self.scores.get(contributor, u256(0)))

        if current == 0 and int(score) > 0:
            contributors = json.loads(self.contributors_json)
            contributors.append(contributor)
            self.contributors_json = json.dumps(contributors)
            self.contributor_count = u256(int(self.contributor_count) + 1)

        self.scores[contributor] = score

    @gl.public.write
    def reset_score(self, contributor: str) -> None:
        """Reset a contributor's score to 0 (owner only)."""
        if gl.message.sender_address != self.owner:
            raise gl.vm.UserError("only owner can reset scores")
        self.scores[contributor.lower()] = u256(0)

    # ─────────────────────────────────────────────
    # READ
    # ─────────────────────────────────────────────

    @gl.public.view
    def get_score(self, contributor: str) -> u256:
        """Get a single contributor's total score."""
        return self.scores.get(contributor.lower(), u256(0))

    @gl.public.view
    def get_all_entries(self) -> str:
        """
        Return ALL contributors and their scores as a sorted JSON array.
        No wallet required to call this.

        Returns JSON:
        [{"address": "0xabc", "score": 420, "rank": 1}, ...]
        """
        contributors = json.loads(self.contributors_json)

        entries = []
        for addr in contributors:
            score = int(self.scores.get(addr, u256(0)))
            if score > 0:
                entries.append({"address": addr, "score": score})

        # Sort descending by score
        entries.sort(key=lambda x: x["score"], reverse=True)

        # Add rank
        for i, e in enumerate(entries):
            e["rank"] = i + 1

        return json.dumps(entries)

    @gl.public.view
    def get_top(self, n: u256) -> str:
        """Return top N contributors as JSON."""
        all_entries = json.loads(self.get_all_entries())
        return json.dumps(all_entries[: int(n)])

    @gl.public.view
    def get_contributor_count(self) -> u256:
        """Return number of unique contributors."""
        return self.contributor_count

    @gl.public.view
    def get_contributors_json(self) -> str:
        """Return raw contributors list as JSON string."""
        return self.contributors_json
