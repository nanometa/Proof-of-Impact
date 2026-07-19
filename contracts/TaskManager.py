# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
from datetime import datetime, timezone
import json


CONTRACT_VERSION = "4.0.0"

TASK_OPEN = "open"
TASK_CLOSED = "closed"
TASK_CANCELLED = "cancelled"
TASK_EXPIRED = "expired"

ESCROW_FUNDED = "funded"
ESCROW_PAYOUT_SCHEDULED = "payout_scheduled"
ESCROW_REFUND_SCHEDULED = "refund_scheduled"

SUBMISSION_PENDING = "pending"
SUBMISSION_EVALUATED = "evaluated"
SUBMISSION_WITHDRAWN = "withdrawn"

MAX_TITLE_LENGTH = 120
MAX_DESCRIPTION_LENGTH = 2000
MAX_CRITERIA_LENGTH = 2000
MAX_CANCEL_REASON_LENGTH = 300
MAX_REWARD_POINTS = 1000000
MIN_PAYOUT_THRESHOLD = 50
MAX_PAYOUT_THRESHOLD = 100
MIN_DURATION_SECONDS = 3600
MAX_DURATION_SECONDS = 30 * 24 * 60 * 60
SETTLEMENT_GRACE_SECONDS = 24 * 60 * 60


@gl.evm.contract_interface
class _NativeRecipient:
    class View:
        pass

    class Write:
        pass


def normalize_address(value: str) -> str:
    if not value or not str(value).strip():
        raise gl.vm.UserError("address cannot be empty")
    return str(value).lower()


def validate_text(value: str, field_name: str, max_length: int) -> str:
    if not value or not value.strip():
        raise gl.vm.UserError(f"{field_name} cannot be empty")
    cleaned = value.strip()
    if len(cleaned) > max_length:
        raise gl.vm.UserError(f"{field_name} is too long")
    return cleaned


def safe_json_load(raw: str) -> dict:
    try:
        parsed = json.loads(raw)
    except Exception:
        raise gl.vm.UserError("stored JSON is invalid")
    if not isinstance(parsed, dict):
        raise gl.vm.UserError("stored JSON must be an object")
    return parsed


def append_json_array(raw: str, value: str) -> str:
    try:
        values = json.loads(raw) if raw else []
    except Exception:
        values = []
    if not isinstance(values, list):
        values = []
    if value not in values:
        values.append(value)
    return json.dumps(values)


class TaskManager(gl.Contract):
    task_storage: TreeMap[str, str]
    task_submissions_json: TreeMap[str, str]
    task_pending_submissions: TreeMap[str, u256]
    task_evaluated_submissions: TreeMap[str, u256]
    task_awarded_points: TreeMap[str, u256]
    creator_task_count: TreeMap[str, u256]
    task_count: u256
    active_task_count: u256
    owner: Address
    authorized_submitter: Address

    task_escrow_total: TreeMap[str, u256]
    task_escrow_remaining: TreeMap[str, u256]
    task_payout_threshold: TreeMap[str, u256]
    task_deadline: TreeMap[str, u256]
    task_settled: TreeMap[str, u256]
    task_escrow_status: TreeMap[str, str]
    task_winner: TreeMap[str, str]
    task_winning_submission: TreeMap[str, str]
    task_payout_amount: TreeMap[str, u256]
    task_refund_amount: TreeMap[str, u256]
    submission_state: TreeMap[str, str]
    submission_task: TreeMap[str, str]
    submission_worker: TreeMap[str, str]
    submission_timestamp: TreeMap[str, u256]
    total_locked_wei: u256
    total_paid_wei: u256
    total_refunded_wei: u256

    def __init__(self):
        self.owner = gl.message.sender_address
        self.authorized_submitter = gl.message.sender_address
        self.task_count = u256(0)
        self.active_task_count = u256(0)
        self.total_locked_wei = u256(0)
        self.total_paid_wei = u256(0)
        self.total_refunded_wei = u256(0)

    def _sender(self) -> str:
        return normalize_address(str(gl.message.sender_address))

    def _now(self) -> int:
        return int(datetime.now(timezone.utc).timestamp())

    def _require_owner(self) -> None:
        if gl.message.sender_address != self.owner:
            raise gl.vm.UserError("only owner")

    def _require_submitter(self) -> None:
        sender = gl.message.sender_address
        if sender != self.owner and sender != self.authorized_submitter:
            raise gl.vm.UserError("only authorized submitter")

    def _get_task(self, task_id: str) -> dict:
        if task_id not in self.task_storage:
            raise gl.vm.UserError("task not found")
        return safe_json_load(self.task_storage[task_id])

    def _store_task(self, task_id: str, task_data: dict) -> None:
        self.task_storage[task_id] = json.dumps(task_data, sort_keys=True)

    def _require_task_manager(self, task_data: dict, actor: str) -> None:
        creator = normalize_address(str(task_data.get("creator", "")))
        sender = normalize_address(actor)
        if sender != creator and gl.message.sender_address != self.owner:
            raise gl.vm.UserError("only task creator or owner")

    def _validate_financial_terms(
        self,
        bounty_wei: u256,
        payout_threshold: u256,
        duration_seconds: u256,
    ) -> None:
        if bounty_wei <= u256(0):
            raise gl.vm.UserError("a GEN bounty deposit is required")
        if payout_threshold < u256(MIN_PAYOUT_THRESHOLD):
            raise gl.vm.UserError("payout threshold is too low")
        if payout_threshold > u256(MAX_PAYOUT_THRESHOLD):
            raise gl.vm.UserError("payout threshold exceeds 100")
        if duration_seconds < u256(MIN_DURATION_SECONDS):
            raise gl.vm.UserError("task duration must be at least one hour")
        if duration_seconds > u256(MAX_DURATION_SECONDS):
            raise gl.vm.UserError("task duration exceeds 30 days")

    def _increment_map_counter(
        self,
        storage: TreeMap[str, u256],
        key: str,
        amount: int,
    ) -> None:
        current = int(storage[key]) if key in storage else 0
        storage[key] = u256(current + amount)

    def _decrement_map_counter(self, storage: TreeMap[str, u256], key: str) -> None:
        current = int(storage[key]) if key in storage else 0
        if current > 0:
            storage[key] = u256(current - 1)

    def _decrease_total_locked(self, amount: int) -> None:
        locked = int(self.total_locked_wei)
        self.total_locked_wei = u256(max(0, locked - amount))

    def _set_task_status(self, task_id: str, task_data: dict, status: str) -> None:
        previous = str(task_data.get("status", ""))
        if previous == status:
            return

        if previous == TASK_OPEN and int(self.active_task_count) > 0:
            self.active_task_count = u256(int(self.active_task_count) - 1)
        if status == TASK_OPEN:
            self.active_task_count = u256(int(self.active_task_count) + 1)

        task_data["status"] = status
        self._store_task(task_id, task_data)

    def _set_escrow_json(self, task_id: str, task_data: dict) -> None:
        task_data["escrow_total_wei"] = str(
            int(self.task_escrow_total[task_id])
            if task_id in self.task_escrow_total
            else 0
        )
        task_data["escrow_remaining_wei"] = str(
            int(self.task_escrow_remaining[task_id])
            if task_id in self.task_escrow_remaining
            else 0
        )
        task_data["payout_threshold"] = int(
            self.task_payout_threshold[task_id]
            if task_id in self.task_payout_threshold
            else u256(0)
        )
        task_data["deadline"] = int(
            self.task_deadline[task_id]
            if task_id in self.task_deadline
            else u256(0)
        )
        task_data["refund_available_at"] = int(
            self.task_deadline[task_id]
            if task_id in self.task_deadline
            else u256(0)
        ) + SETTLEMENT_GRACE_SECONDS
        task_data["escrow_status"] = (
            self.task_escrow_status[task_id]
            if task_id in self.task_escrow_status
            else ""
        )
        task_data["winner"] = (
            self.task_winner[task_id] if task_id in self.task_winner else ""
        )
        task_data["winning_submission"] = (
            self.task_winning_submission[task_id]
            if task_id in self.task_winning_submission
            else ""
        )
        task_data["payout_wei"] = str(
            int(self.task_payout_amount[task_id])
            if task_id in self.task_payout_amount
            else 0
        )
        task_data["refund_wei"] = str(
            int(self.task_refund_amount[task_id])
            if task_id in self.task_refund_amount
            else 0
        )

    def _record_submission_identity(
        self,
        task_id: str,
        task_data: dict,
        sub_id: str,
    ) -> None:
        if sub_id in self.submission_state:
            return
        self.task_submissions_json[task_id] = append_json_array(
            self.task_submissions_json[task_id]
            if task_id in self.task_submissions_json
            else "[]",
            sub_id,
        )
        task_data["submission_count"] = int(task_data.get("submission_count", 0)) + 1

    def _schedule_payout(
        self,
        task_id: str,
        task_data: dict,
        sub_id: str,
        worker: str,
    ) -> None:
        if int(self.task_settled[task_id]) > 0:
            return

        amount = int(self.task_escrow_remaining[task_id])
        if amount <= 0:
            raise gl.vm.UserError("escrow has no remaining balance")

        normalized_worker = normalize_address(worker)
        self.task_settled[task_id] = u256(1)
        self.task_escrow_remaining[task_id] = u256(0)
        self.task_escrow_status[task_id] = ESCROW_PAYOUT_SCHEDULED
        self.task_winner[task_id] = normalized_worker
        self.task_winning_submission[task_id] = sub_id
        self.task_payout_amount[task_id] = u256(amount)
        self.total_paid_wei = u256(int(self.total_paid_wei) + amount)
        self._decrease_total_locked(amount)

        self._set_escrow_json(task_id, task_data)
        self._set_task_status(task_id, task_data, TASK_CLOSED)

        _NativeRecipient(Address(normalized_worker)).emit_transfer(value=u256(amount))

    def _schedule_refund(
        self,
        task_id: str,
        task_data: dict,
        status: str,
        reason: str,
    ) -> None:
        if int(self.task_settled[task_id]) > 0:
            raise gl.vm.UserError("task escrow is already settled")

        amount = int(self.task_escrow_remaining[task_id])
        creator = normalize_address(str(task_data.get("creator", "")))

        self.task_settled[task_id] = u256(1)
        self.task_escrow_remaining[task_id] = u256(0)
        self.task_escrow_status[task_id] = ESCROW_REFUND_SCHEDULED
        self.task_refund_amount[task_id] = u256(amount)
        self.total_refunded_wei = u256(int(self.total_refunded_wei) + amount)
        self._decrease_total_locked(amount)

        task_data["cancel_reason"] = reason
        self._set_escrow_json(task_id, task_data)
        self._set_task_status(task_id, task_data, status)

        if amount > 0:
            _NativeRecipient(Address(creator)).emit_transfer(value=u256(amount))

    def _create_task_for(
        self,
        creator: str,
        title: str,
        description: str,
        criteria: str,
        reward_points: u256,
        payout_threshold: u256,
        duration_seconds: u256,
        bounty_wei: u256,
    ) -> str:
        clean_title = validate_text(title, "title", MAX_TITLE_LENGTH)
        clean_description = validate_text(
            description,
            "description",
            MAX_DESCRIPTION_LENGTH,
        )
        clean_criteria = validate_text(criteria, "criteria", MAX_CRITERIA_LENGTH)

        if reward_points <= u256(0):
            raise gl.vm.UserError("reward_points must be greater than 0")
        if reward_points > u256(MAX_REWARD_POINTS):
            raise gl.vm.UserError("reward_points exceeds platform maximum")
        self._validate_financial_terms(
            bounty_wei,
            payout_threshold,
            duration_seconds,
        )

        normalized_creator = normalize_address(creator)
        task_id = "task-" + str(self.task_count)
        deadline = self._now() + int(duration_seconds)

        self.task_escrow_total[task_id] = bounty_wei
        self.task_escrow_remaining[task_id] = bounty_wei
        self.task_payout_threshold[task_id] = payout_threshold
        self.task_deadline[task_id] = u256(deadline)
        self.task_settled[task_id] = u256(0)
        self.task_escrow_status[task_id] = ESCROW_FUNDED
        self.task_winner[task_id] = ""
        self.task_winning_submission[task_id] = ""
        self.task_payout_amount[task_id] = u256(0)
        self.task_refund_amount[task_id] = u256(0)

        task_dict = {
            "task_id": task_id,
            "title": clean_title,
            "description": clean_description,
            "criteria": clean_criteria,
            "reward_points": int(reward_points),
            "status": TASK_OPEN,
            "creator": normalized_creator,
            "submission_count": 0,
            "evaluated_count": 0,
            "awarded_points": 0,
            "revision": 1,
        }
        self._set_escrow_json(task_id, task_dict)

        self._store_task(task_id, task_dict)
        self.task_submissions_json[task_id] = "[]"
        self.task_pending_submissions[task_id] = u256(0)
        self.task_evaluated_submissions[task_id] = u256(0)
        self.task_awarded_points[task_id] = u256(0)
        self._increment_map_counter(self.creator_task_count, normalized_creator, 1)

        self.task_count = u256(int(self.task_count) + 1)
        self.active_task_count = u256(int(self.active_task_count) + 1)
        self.total_locked_wei = u256(int(self.total_locked_wei) + int(bounty_wei))
        return task_id

    @gl.public.write
    def transfer_ownership(self, new_owner: Address) -> None:
        self._require_owner()
        self.owner = new_owner

    @gl.public.write
    def set_authorized_submitter(self, submitter: Address) -> None:
        self._require_owner()
        self.authorized_submitter = submitter

    @gl.public.write.payable
    def create_task(
        self,
        title: str,
        description: str,
        criteria: str,
        reward_points: u256,
        payout_threshold: u256,
        duration_seconds: u256,
    ) -> str:
        return self._create_task_for(
            self._sender(),
            title,
            description,
            criteria,
            reward_points,
            payout_threshold,
            duration_seconds,
            gl.message.value,
        )

    @gl.public.write.payable
    def create_task_for(
        self,
        creator: str,
        title: str,
        description: str,
        criteria: str,
        reward_points: u256,
        payout_threshold: u256,
        duration_seconds: u256,
    ) -> str:
        self._require_submitter()
        return self._create_task_for(
            creator,
            title,
            description,
            criteria,
            reward_points,
            payout_threshold,
            duration_seconds,
            gl.message.value,
        )

    @gl.public.write
    def update_task_metadata(
        self,
        task_id: str,
        title: str,
        description: str,
        criteria: str,
    ) -> None:
        task_data = self._get_task(task_id)
        self._require_task_manager(task_data, self._sender())

        if task_data.get("status", "") != TASK_OPEN:
            raise gl.vm.UserError("only open tasks can be edited")
        if int(self.task_pending_submissions[task_id]) > 0:
            raise gl.vm.UserError("task already has submissions")
        if int(task_data.get("submission_count", 0)) > 0:
            raise gl.vm.UserError("task already has submission history")

        task_data["title"] = validate_text(title, "title", MAX_TITLE_LENGTH)
        task_data["description"] = validate_text(
            description,
            "description",
            MAX_DESCRIPTION_LENGTH,
        )
        task_data["criteria"] = validate_text(criteria, "criteria", MAX_CRITERIA_LENGTH)
        task_data["revision"] = int(task_data.get("revision", 1)) + 1
        self._store_task(task_id, task_data)

    @gl.public.write
    def close_task(self, task_id: str) -> None:
        task_data = self._get_task(task_id)
        self._require_task_manager(task_data, self._sender())
        raise gl.vm.UserError("GEN bounty is locked until a winner or task expiry")

    @gl.public.write.payable
    def reopen_task(
        self,
        task_id: str,
        payout_threshold: u256,
        duration_seconds: u256,
    ) -> None:
        task_data = self._get_task(task_id)
        self._require_task_manager(task_data, self._sender())
        if task_data.get("status", "") not in {
            TASK_CLOSED,
            TASK_CANCELLED,
            TASK_EXPIRED,
        }:
            raise gl.vm.UserError("task must be closed, cancelled, or expired")
        if self.task_winner[task_id]:
            raise gl.vm.UserError("a paid task cannot be reopened")

        self._validate_financial_terms(
            gl.message.value,
            payout_threshold,
            duration_seconds,
        )

        bounty = gl.message.value
        self.task_escrow_total[task_id] = bounty
        self.task_escrow_remaining[task_id] = bounty
        self.task_payout_threshold[task_id] = payout_threshold
        self.task_deadline[task_id] = u256(self._now() + int(duration_seconds))
        self.task_settled[task_id] = u256(0)
        self.task_escrow_status[task_id] = ESCROW_FUNDED
        self.task_winner[task_id] = ""
        self.task_winning_submission[task_id] = ""
        self.task_payout_amount[task_id] = u256(0)
        self.task_refund_amount[task_id] = u256(0)

        task_data["revision"] = int(task_data.get("revision", 1)) + 1
        task_data["cancel_reason"] = ""
        self._set_escrow_json(task_id, task_data)
        self._set_task_status(task_id, task_data, TASK_OPEN)
        self.total_locked_wei = u256(int(self.total_locked_wei) + int(bounty))

    @gl.public.write
    def cancel_task(self, task_id: str, reason: str) -> None:
        task_data = self._get_task(task_id)
        self._require_task_manager(task_data, self._sender())
        raise gl.vm.UserError("GEN bounty is locked until a winner or task expiry")

    @gl.public.write
    def refund_expired_task(self, task_id: str) -> None:
        task_data = self._get_task(task_id)
        if task_data.get("status", "") != TASK_OPEN:
            raise gl.vm.UserError("task is not open")
        if int(self.task_settled[task_id]) > 0:
            raise gl.vm.UserError("task escrow is already settled")
        refund_available_at = (
            int(self.task_deadline[task_id]) + SETTLEMENT_GRACE_SECONDS
        )
        if self._now() <= refund_available_at:
            raise gl.vm.UserError("settlement grace period is still active")
        if int(self.task_pending_submissions[task_id]) > 0:
            raise gl.vm.UserError("pending submissions must be evaluated or withdrawn")

        self._schedule_refund(
            task_id,
            task_data,
            TASK_EXPIRED,
            "task expired without a qualifying winner",
        )

    @gl.public.write
    def record_submission(
        self,
        task_id: str,
        sub_id: str,
        worker: str,
        submitted_at: u256,
    ) -> None:
        self._require_submitter()
        task_data = self._get_task(task_id)

        if sub_id in self.submission_state:
            return
        if task_data.get("status", "") != TASK_OPEN:
            raise gl.vm.UserError("task is not open")
        if int(self.task_settled[task_id]) > 0:
            raise gl.vm.UserError("task escrow is already settled")
        if int(submitted_at) <= 0:
            raise gl.vm.UserError("submission timestamp is invalid")
        if int(submitted_at) > int(self.task_deadline[task_id]):
            raise gl.vm.UserError("task submission deadline has passed")

        normalized_worker = normalize_address(worker)
        if normalized_worker == normalize_address(str(task_data.get("creator", ""))):
            raise gl.vm.UserError("task creator cannot submit to own task")
        self._record_submission_identity(task_id, task_data, sub_id)
        self.submission_state[sub_id] = SUBMISSION_PENDING
        self.submission_task[sub_id] = task_id
        self.submission_worker[sub_id] = normalized_worker
        self.submission_timestamp[sub_id] = submitted_at
        self._increment_map_counter(self.task_pending_submissions, task_id, 1)
        task_data["last_submitter"] = normalized_worker
        self._store_task(task_id, task_data)

    @gl.public.write
    def record_withdrawal(self, task_id: str, sub_id: str) -> None:
        self._require_submitter()
        task_data = self._get_task(task_id)
        current_state = (
            self.submission_state[sub_id] if sub_id in self.submission_state else ""
        )

        if current_state == SUBMISSION_WITHDRAWN:
            return
        if current_state == SUBMISSION_EVALUATED:
            raise gl.vm.UserError("evaluated submission cannot be withdrawn")
        if sub_id in self.submission_task and self.submission_task[sub_id] != task_id:
            raise gl.vm.UserError("submission does not belong to task")

        if not current_state:
            self._record_submission_identity(task_id, task_data, sub_id)
            self.submission_task[sub_id] = task_id
        if current_state == SUBMISSION_PENDING:
            self._decrement_map_counter(self.task_pending_submissions, task_id)

        self.submission_state[sub_id] = SUBMISSION_WITHDRAWN
        self._store_task(task_id, task_data)

        if (
            task_data.get("status", "") == TASK_OPEN
            and int(self.task_settled[task_id]) == 0
            and self._now()
            > int(self.task_deadline[task_id]) + SETTLEMENT_GRACE_SECONDS
            and int(self.task_pending_submissions[task_id]) == 0
        ):
            self._schedule_refund(
                task_id,
                task_data,
                TASK_EXPIRED,
                "task expired without a qualifying winner",
            )

    @gl.public.write
    def record_evaluation(
        self,
        task_id: str,
        sub_id: str,
        worker: str,
        score: u256,
        points_awarded: u256,
    ) -> None:
        self._require_submitter()
        task_data = self._get_task(task_id)
        current_state = (
            self.submission_state[sub_id] if sub_id in self.submission_state else ""
        )

        if current_state == SUBMISSION_EVALUATED:
            return
        if current_state == SUBMISSION_WITHDRAWN:
            raise gl.vm.UserError("withdrawn submission cannot be evaluated")
        if score > u256(100):
            raise gl.vm.UserError("score exceeds 100")
        if points_awarded > u256(int(task_data.get("reward_points", 0))):
            raise gl.vm.UserError("points exceed task reward")
        if sub_id in self.submission_task and self.submission_task[sub_id] != task_id:
            raise gl.vm.UserError("submission does not belong to task")

        normalized_worker = normalize_address(worker)
        if (
            sub_id in self.submission_worker
            and self.submission_worker[sub_id] != normalized_worker
        ):
            raise gl.vm.UserError("submission worker mismatch")
        if not current_state:
            self._record_submission_identity(task_id, task_data, sub_id)
            self.submission_task[sub_id] = task_id
            self.submission_worker[sub_id] = normalized_worker
        if current_state == SUBMISSION_PENDING:
            self._decrement_map_counter(self.task_pending_submissions, task_id)

        self.submission_state[sub_id] = SUBMISSION_EVALUATED
        self._increment_map_counter(self.task_evaluated_submissions, task_id, 1)

        awarded = int(points_awarded)
        current_awarded = (
            int(self.task_awarded_points[task_id])
            if task_id in self.task_awarded_points
            else 0
        )
        self.task_awarded_points[task_id] = u256(current_awarded + awarded)
        task_data["evaluated_count"] = int(task_data.get("evaluated_count", 0)) + 1
        task_data["awarded_points"] = int(task_data.get("awarded_points", 0)) + awarded

        qualifies = int(score) >= int(self.task_payout_threshold[task_id])
        if (
            qualifies
            and task_data.get("status", "") == TASK_OPEN
            and int(self.task_settled[task_id]) == 0
        ):
            self._schedule_payout(
                task_id,
                task_data,
                sub_id,
                normalized_worker,
            )
            return

        self._store_task(task_id, task_data)

        if (
            task_data.get("status", "") == TASK_OPEN
            and int(self.task_settled[task_id]) == 0
            and self._now()
            > int(self.task_deadline[task_id]) + SETTLEMENT_GRACE_SECONDS
            and int(self.task_pending_submissions[task_id]) == 0
        ):
            self._schedule_refund(
                task_id,
                task_data,
                TASK_EXPIRED,
                "task expired without a qualifying winner",
            )

    @gl.public.view
    def get_task(self, task_id: str) -> str:
        return self.task_storage[task_id] if task_id in self.task_storage else ""

    @gl.public.view
    def get_task_submissions(self, task_id: str) -> str:
        if task_id not in self.task_submissions_json:
            return "[]"
        return self.task_submissions_json[task_id]

    @gl.public.view
    def get_task_stats(self, task_id: str) -> str:
        if task_id not in self.task_storage:
            return "{}"
        return json.dumps(
            {
                "task_id": task_id,
                "pending_submissions": int(
                    self.task_pending_submissions[task_id]
                    if task_id in self.task_pending_submissions
                    else u256(0)
                ),
                "evaluated_submissions": int(
                    self.task_evaluated_submissions[task_id]
                    if task_id in self.task_evaluated_submissions
                    else u256(0)
                ),
                "awarded_points": int(
                    self.task_awarded_points[task_id]
                    if task_id in self.task_awarded_points
                    else u256(0)
                ),
                "escrow_total_wei": str(
                    int(self.task_escrow_total[task_id])
                    if task_id in self.task_escrow_total
                    else 0
                ),
                "escrow_remaining_wei": str(
                    int(self.task_escrow_remaining[task_id])
                    if task_id in self.task_escrow_remaining
                    else 0
                ),
                "escrow_status": (
                    self.task_escrow_status[task_id]
                    if task_id in self.task_escrow_status
                    else ""
                ),
                "winner": (
                    self.task_winner[task_id] if task_id in self.task_winner else ""
                ),
            },
            sort_keys=True,
        )

    @gl.public.view
    def get_task_escrow(self, task_id: str) -> str:
        if task_id not in self.task_storage:
            return "{}"
        return json.dumps(
            {
                "task_id": task_id,
                "total_wei": str(int(self.task_escrow_total[task_id])),
                "remaining_wei": str(int(self.task_escrow_remaining[task_id])),
                "payout_threshold": int(self.task_payout_threshold[task_id]),
                "deadline": int(self.task_deadline[task_id]),
                "refund_available_at": int(self.task_deadline[task_id])
                + SETTLEMENT_GRACE_SECONDS,
                "settled": int(self.task_settled[task_id]) > 0,
                "status": self.task_escrow_status[task_id],
                "winner": self.task_winner[task_id],
                "winning_submission": self.task_winning_submission[task_id],
                "payout_wei": str(int(self.task_payout_amount[task_id])),
                "refund_wei": str(int(self.task_refund_amount[task_id])),
            },
            sort_keys=True,
        )

    @gl.public.view
    def is_task_expired(self, task_id: str) -> u256:
        if task_id not in self.task_deadline:
            return u256(0)
        return u256(1) if self._now() > int(self.task_deadline[task_id]) else u256(0)

    @gl.public.view
    def get_platform_stats(self) -> str:
        return json.dumps(
            {
                "version": CONTRACT_VERSION,
                "task_count": int(self.task_count),
                "active_task_count": int(self.active_task_count),
                "total_locked_wei": str(int(self.total_locked_wei)),
                "total_paid_wei": str(int(self.total_paid_wei)),
                "total_refunded_wei": str(int(self.total_refunded_wei)),
                "contract_balance_wei": str(int(self.balance)),
                "owner": str(self.owner),
                "authorized_submitter": str(self.authorized_submitter),
            },
            sort_keys=True,
        )

    @gl.public.view
    def get_creator_task_count(self, creator: str) -> u256:
        normalized = normalize_address(creator)
        if normalized not in self.creator_task_count:
            return u256(0)
        return self.creator_task_count[normalized]

    @gl.public.view
    def get_task_awarded_points(self, task_id: str) -> u256:
        if task_id not in self.task_awarded_points:
            return u256(0)
        return self.task_awarded_points[task_id]

    @gl.public.view
    def get_task_pending_count(self, task_id: str) -> u256:
        if task_id not in self.task_pending_submissions:
            return u256(0)
        return self.task_pending_submissions[task_id]

    @gl.public.view
    def get_task_evaluated_count(self, task_id: str) -> u256:
        if task_id not in self.task_evaluated_submissions:
            return u256(0)
        return self.task_evaluated_submissions[task_id]

    @gl.public.view
    def get_task_count(self) -> u256:
        return self.task_count

    @gl.public.view
    def get_active_task_count(self) -> u256:
        return self.active_task_count

    @gl.public.view
    def get_contract_balance(self) -> u256:
        return self.balance

    @gl.public.view
    def get_owner(self) -> str:
        return str(self.owner)

    @gl.public.view
    def get_authorized_submitter(self) -> str:
        return str(self.authorized_submitter)

    @gl.public.view
    def get_version(self) -> str:
        return CONTRACT_VERSION
