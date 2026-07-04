# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
import json


class GlobalLeaderboard(gl.Contract):
    """
    Onchain leaderboard for ProofOfImpact.

    The deployer owns admin actions. The ProofOfImpact contract address must be
    set as authorized_writer after deployment, so evaluations can push earned
    points directly to this contract.
    """

    scores: TreeMap[str, u256]
    known_contributors: TreeMap[str, u256]
    contributors_json: str
    contributor_count: u256
    owner: Address
    authorized_writer: Address

    def __init__(self):
        self.owner = gl.message.sender_address
        self.authorized_writer = gl.message.sender_address
        self.contributors_json = "[]"
        self.contributor_count = u256(0)

    def _require_owner(self) -> None:
        if gl.message.sender_address != self.owner:
            raise gl.vm.UserError("only owner")

    def _require_writer(self) -> None:
        sender = gl.message.sender_address
        if sender != self.owner and sender != self.authorized_writer:
            raise gl.vm.UserError("only authorized writer")

    def _normalize(self, contributor: str) -> str:
        raw = str(contributor)
        if not raw or not raw.strip():
            raise gl.vm.UserError("contributor cannot be empty")
        return raw.lower()

    def _ensure_contributor(self, contributor: str) -> None:
        if contributor in self.known_contributors:
            return

        contributors = json.loads(self.contributors_json)
        contributors.append(contributor)
        self.contributors_json = json.dumps(contributors)
        self.known_contributors[contributor] = u256(1)
        self.contributor_count = u256(int(self.contributor_count) + 1)

    @gl.public.write
    def set_authorized_writer(self, writer: Address) -> None:
        self._require_owner()
        self.authorized_writer = writer

    @gl.public.write
    def record_score(self, contributor: str, score: u256) -> None:
        self._require_writer()
        if score <= u256(0):
            raise gl.vm.UserError("score must be greater than 0")

        normalized = self._normalize(contributor)
        current = int(self.scores[normalized]) if normalized in self.scores else 0
        self._ensure_contributor(normalized)
        self.scores[normalized] = u256(current + int(score))

    @gl.public.write
    def set_score(self, contributor: str, score: u256) -> None:
        self._require_writer()
        normalized = self._normalize(contributor)

        if score > u256(0):
            self._ensure_contributor(normalized)

        self.scores[normalized] = score

    @gl.public.write
    def reset_score(self, contributor: str) -> None:
        self._require_owner()
        normalized = self._normalize(contributor)
        self.scores[normalized] = u256(0)

    @gl.public.view
    def get_score(self, contributor: str) -> u256:
        normalized = self._normalize(contributor)
        if normalized not in self.scores:
            return u256(0)
        return self.scores[normalized]

    @gl.public.view
    def get_all_entries(self) -> str:
        contributors = json.loads(self.contributors_json)
        entries = []

        for contributor in contributors:
            score = int(self.scores[contributor]) if contributor in self.scores else 0
            if score > 0:
                entries.append({"address": contributor, "score": score})

        entries.sort(key=lambda item: item["score"], reverse=True)

        for index, entry in enumerate(entries):
            entry["rank"] = index + 1

        return json.dumps(entries)

    @gl.public.view
    def get_top(self, n: u256) -> str:
        all_entries = json.loads(self.get_all_entries())
        return json.dumps(all_entries[: int(n)])

    @gl.public.view
    def get_contributor_count(self) -> u256:
        return self.contributor_count

    @gl.public.view
    def get_contributors_json(self) -> str:
        return self.contributors_json

    @gl.public.view
    def get_authorized_writer(self) -> str:
        return str(self.authorized_writer)
