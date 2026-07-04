# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
import json


CONTRACT_VERSION = "3.0.0"
TASK_OPEN = "open"
TASK_CLOSED = "closed"
TASK_CANCELLED = "cancelled"

MAX_TITLE_LENGTH = 120
MAX_DESCRIPTION_LENGTH = 2000
MAX_CRITERIA_LENGTH = 2000
MAX_CANCEL_REASON_LENGTH = 300
MAX_REWARD_POINTS = 1000000


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

    def __init__(self):
        self.owner = gl.message.sender_address
        self.authorized_submitter = gl.message.sender_address
        self.task_count = u256(0)
        self.active_task_count = u256(0)

    def _sender(self) -> str:
        return normalize_address(str(gl.message.sender_address))

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

    def _increment_map_counter(self, storage: TreeMap[str, u256], key: str, amount: int) -> None:
        current = int(storage[key]) if key in storage else 0
        storage[key] = u256(current + amount)

    def _decrement_map_counter(self, storage: TreeMap[str, u256], key: str) -> None:
        current = int(storage[key]) if key in storage else 0
        if current > 0:
            storage[key] = u256(current - 1)

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

    def _create_task_for(
        self,
        creator: str,
        title: str,
        description: str,
        criteria: str,
        reward_points: u256,
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

        normalized_creator = normalize_address(creator)
        task_id = "task-" + str(self.task_count)
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

        self._store_task(task_id, task_dict)
        self.task_submissions_json[task_id] = "[]"
        self.task_pending_submissions[task_id] = u256(0)
        self.task_evaluated_submissions[task_id] = u256(0)
        self.task_awarded_points[task_id] = u256(0)
        self._increment_map_counter(self.creator_task_count, normalized_creator, 1)

        self.task_count = u256(int(self.task_count) + 1)
        self.active_task_count = u256(int(self.active_task_count) + 1)
        return task_id

    @gl.public.write
    def transfer_ownership(self, new_owner: Address) -> None:
        self._require_owner()
        self.owner = new_owner

    @gl.public.write
    def set_authorized_submitter(self, submitter: Address) -> None:
        self._require_owner()
        self.authorized_submitter = submitter

    @gl.public.write
    def create_task(
        self,
        title: str,
        description: str,
        criteria: str,
        reward_points: u256,
    ) -> str:
        return self._create_task_for(
            self._sender(),
            title,
            description,
            criteria,
            reward_points,
        )

    @gl.public.write
    def create_task_for(
        self,
        creator: str,
        title: str,
        description: str,
        criteria: str,
        reward_points: u256,
    ) -> str:
        self._require_submitter()
        return self._create_task_for(
            creator,
            title,
            description,
            criteria,
            reward_points,
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
        if int(self.task_evaluated_submissions[task_id]) > 0:
            raise gl.vm.UserError("task already has evaluated submissions")

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
        if task_data.get("status", "") != TASK_OPEN:
            raise gl.vm.UserError("task is not open")
        self._set_task_status(task_id, task_data, TASK_CLOSED)

    @gl.public.write
    def reopen_task(self, task_id: str) -> None:
        task_data = self._get_task(task_id)
        self._require_task_manager(task_data, self._sender())
        if task_data.get("status", "") != TASK_CLOSED:
            raise gl.vm.UserError("only closed tasks can be reopened")
        self._set_task_status(task_id, task_data, TASK_OPEN)

    @gl.public.write
    def cancel_task(self, task_id: str, reason: str) -> None:
        task_data = self._get_task(task_id)
        self._require_task_manager(task_data, self._sender())
        if task_data.get("status", "") == TASK_CANCELLED:
            raise gl.vm.UserError("task already cancelled")

        task_data["cancel_reason"] = validate_text(
            reason,
            "reason",
            MAX_CANCEL_REASON_LENGTH,
        )
        self._set_task_status(task_id, task_data, TASK_CANCELLED)

    @gl.public.write
    def record_submission(self, task_id: str, sub_id: str, worker: str) -> None:
        self._require_submitter()
        task_data = self._get_task(task_id)
        if task_data.get("status", "") != TASK_OPEN:
            raise gl.vm.UserError("task is not open")

        self.task_submissions_json[task_id] = append_json_array(
            self.task_submissions_json[task_id],
            sub_id,
        )
        self._increment_map_counter(self.task_pending_submissions, task_id, 1)
        task_data["submission_count"] = int(task_data.get("submission_count", 0)) + 1
        self._store_task(task_id, task_data)

    @gl.public.write
    def record_withdrawal(self, task_id: str) -> None:
        self._require_submitter()
        self._decrement_map_counter(self.task_pending_submissions, task_id)

    @gl.public.write
    def record_evaluation(self, task_id: str, points_awarded: u256) -> None:
        self._require_submitter()
        task_data = self._get_task(task_id)
        self._decrement_map_counter(self.task_pending_submissions, task_id)
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
        self._store_task(task_id, task_data)

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
        pending = (
            int(self.task_pending_submissions[task_id])
            if task_id in self.task_pending_submissions
            else 0
        )
        evaluated = (
            int(self.task_evaluated_submissions[task_id])
            if task_id in self.task_evaluated_submissions
            else 0
        )
        awarded = (
            int(self.task_awarded_points[task_id])
            if task_id in self.task_awarded_points
            else 0
        )
        return json.dumps(
            {
                "task_id": task_id,
                "pending_submissions": pending,
                "evaluated_submissions": evaluated,
                "awarded_points": awarded,
            },
            sort_keys=True,
        )

    @gl.public.view
    def get_platform_stats(self) -> str:
        return json.dumps(
            {
                "version": CONTRACT_VERSION,
                "task_count": int(self.task_count),
                "active_task_count": int(self.active_task_count),
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
    def get_owner(self) -> str:
        return str(self.owner)

    @gl.public.view
    def get_authorized_submitter(self) -> str:
        return str(self.authorized_submitter)

    @gl.public.view
    def get_version(self) -> str:
        return CONTRACT_VERSION
