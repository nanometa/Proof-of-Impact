# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
import json


CONTRACT_VERSION = "3.0.2"
ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

TASK_OPEN = "open"
TASK_CLOSED = "closed"
TASK_CANCELLED = "cancelled"

SUBMISSION_PENDING = "pending"
SUBMISSION_EVALUATED = "evaluated"
SUBMISSION_WITHDRAWN = "withdrawn"

MAX_TITLE_LENGTH = 120
MAX_DESCRIPTION_LENGTH = 2000
MAX_CRITERIA_LENGTH = 2000
MAX_WORK_URL_LENGTH = 256
MAX_SUBMISSION_DESCRIPTION_LENGTH = 1200
MAX_FETCHED_CONTENT_LENGTH = 650
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


def validate_url(value: str) -> str:
    cleaned = validate_text(value, "work_url", MAX_WORK_URL_LENGTH)
    lowered = cleaned.lower()
    if not (
        lowered.startswith("https://")
        or lowered.startswith("http://")
        or lowered.startswith("ipfs://")
    ):
        raise gl.vm.UserError("work_url must start with http, https, or ipfs")
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


def make_evaluation_fallback(message: str) -> dict:
    return {
        "score": 0,
        "grade": "F",
        "feedback": message,
        "strengths": ["Submission received", "Evidence URL provided"],
        "improvements": ["Provide clearer evidence", "Make the work match the task criteria"],
        "criteria_scores": {"overall": 0},
        "url_valid": False,
        "risk_flags": ["evaluation_fallback"],
    }


def normalize_text_list(value, fallback_a: str, fallback_b: str) -> list:
    if not isinstance(value, list):
        return [fallback_a, fallback_b]

    cleaned = []
    for item in value:
        text = str(item).strip()
        if text:
            cleaned.append(text[:240])
        if len(cleaned) >= 5:
            break

    if len(cleaned) < 2:
        return [fallback_a, fallback_b]
    return cleaned


def parse_evaluation_result(raw) -> dict:
    fallback = make_evaluation_fallback("Could not parse evaluation result.")

    try:
        if isinstance(raw, dict):
            result = raw
        else:
            cleaned = str(raw).replace("```json", "").replace("```", "").strip()
            start = cleaned.find("{")
            end = cleaned.rfind("}") + 1
            if start >= 0 and end > start:
                cleaned = cleaned[start:end]
            result = json.loads(cleaned)
    except Exception:
        return fallback

    if not isinstance(result, dict):
        return fallback

    try:
        score = max(0, min(100, int(result.get("score", 0))))
    except Exception:
        score = 0

    grade = str(result.get("grade", "F")).strip().upper()
    if grade not in {"A", "B", "C", "D", "F"}:
        if score >= 90:
            grade = "A"
        elif score >= 80:
            grade = "B"
        elif score >= 70:
            grade = "C"
        elif score >= 60:
            grade = "D"
        else:
            grade = "F"

    feedback = str(result.get("feedback", "")).strip()
    if not feedback:
        feedback = "No feedback provided."
    feedback = feedback[:1200]

    criteria_scores = result.get("criteria_scores", {})
    if not isinstance(criteria_scores, dict):
        criteria_scores = {"overall": score}

    cleaned_criteria = {}
    for key, val in criteria_scores.items():
        try:
            cleaned_criteria[str(key)[:80]] = max(0, min(100, int(val)))
        except Exception:
            cleaned_criteria[str(key)[:80]] = 0

    risk_flags = result.get("risk_flags", [])
    if not isinstance(risk_flags, list):
        risk_flags = []
    cleaned_flags = []
    for flag in risk_flags:
        text = str(flag).strip()
        if text:
            cleaned_flags.append(text[:80])
        if len(cleaned_flags) >= 6:
            break

    return {
        "score": score,
        "grade": grade,
        "feedback": feedback,
        "strengths": normalize_text_list(
            result.get("strengths", []),
            "Work was submitted",
            "Evidence URL was provided",
        ),
        "improvements": normalize_text_list(
            result.get("improvements", []),
            "Add more concrete proof",
            "Align the result more tightly with the criteria",
        ),
        "criteria_scores": cleaned_criteria,
        "url_valid": bool(result.get("url_valid", False)),
        "risk_flags": cleaned_flags,
    }


def build_evaluation_prompt(
    task_title: str,
    task_description: str,
    task_criteria: str,
    reward_points: int,
    work_url: str,
    work_description: str,
    url_content: str,
) -> str:
    return (
        "Evaluate a proof-of-work submission. Be strict, concise, and return JSON only.\n\n"
        f"Task title: {task_title}\n"
        f"Task criteria: {task_criteria}\n"
        f"Maximum reward points: {reward_points}\n\n"
        f"Submitted work URL: {work_url}\n"
        f"Worker description: {work_description}\n\n"
        f"Fetched URL content:\n{url_content}\n\n"
        "Evaluation rules:\n"
        "- Score from 0 to 100.\n"
        "- If the URL cannot be fetched or contains no relevant evidence, score <= 30.\n"
        "- If the content contradicts the worker description, score <= 50.\n"
        "- If the work is useful but incomplete, use 50-79.\n"
        "- If the work fully satisfies the criteria with clear proof, use 80-100.\n"
        "Return compact valid JSON with these exact keys:\n"
        "{"
        '"score": integer, '
        '"grade": "A"|"B"|"C"|"D"|"F", '
        '"feedback": string, '
        '"strengths": string[], '
        '"improvements": string[], '
        '"criteria_scores": object, '
        '"url_valid": boolean, '
        '"risk_flags": string[]'
        "}"
    )


def same_pass_band(left_score: int, right_score: int) -> bool:
    if (left_score >= 60) != (right_score >= 60):
        return False
    if (left_score >= 80) != (right_score >= 80):
        return False
    return True


def evaluation_matches(leader: dict, validator: dict) -> bool:
    try:
        leader_score = int(leader.get("score", 0))
        validator_score = int(validator.get("score", 0))
    except Exception:
        return False

    if bool(leader.get("url_valid", False)) != bool(validator.get("url_valid", False)):
        return False
    if not same_pass_band(leader_score, validator_score):
        return False
    if abs(leader_score - validator_score) > 15:
        return False
    return True


def grade_from_score(score: int) -> str:
    if score >= 90:
        return "A"
    if score >= 80:
        return "B"
    if score >= 70:
        return "C"
    if score >= 60:
        return "D"
    return "F"


def normalize_signal_text(value: str) -> str:
    text = str(value).lower()
    for separator in "/\\-_.,:;()[]{}|?&=#\n\t\r":
        text = text.replace(separator, " ")
    return " " + " ".join(text.split()) + " "


def has_signal(text: str, term: str) -> bool:
    needle = normalize_signal_text(term).strip()
    if not needle:
        return False
    return (" " + needle + " ") in text


def count_signals(text: str, terms: list) -> int:
    count = 0
    for term in terms:
        if has_signal(text, str(term)):
            count += 1
    return count


def keyword_score(text: str, terms: list) -> int:
    if len(terms) == 0:
        return 0
    hits = count_signals(text, terms)
    return min(100, (hits * 100) // len(terms))


def bounded_score(value: int) -> int:
    if value < 0:
        return 0
    if value > 100:
        return 100
    return value


def extract_repo_hint(raw_task: str, raw_work: str) -> str:
    cleaned = (
        raw_task.replace("(", " ")
        .replace(")", " ")
        .replace("[", " ")
        .replace("]", " ")
        .replace(",", " ")
    )
    for token in cleaned.split():
        repo = token.strip().strip(".:;\"'")
        if "/" in repo and len(repo) >= 5 and repo in raw_work:
            return repo
    return ""


def evaluate_ai_gpu_task(work_text: str, raw_work: str) -> dict:
    inference_terms = [
        "ai",
        "llm",
        "inference",
        "inferencing",
        "serving",
        "serve",
        "model",
        "models",
        "runtime",
        "engine",
    ]
    gpu_terms = [
        "gpu",
        "cuda",
        "hip",
        "kernel",
        "kernels",
        "attention",
        "triton",
        "tensor",
        "accelerator",
    ]
    perf_terms = [
        "throughput",
        "latency",
        "batching",
        "batch",
        "quantization",
        "quantized",
        "memory",
        "optimization",
        "optimizations",
        "optimized",
        "performance",
        "pagedattention",
    ]

    inference_score = keyword_score(work_text, inference_terms)
    gpu_score = keyword_score(work_text, gpu_terms)
    perf_score = keyword_score(work_text, perf_terms)
    inference_hits = count_signals(work_text, inference_terms)
    gpu_hits = count_signals(work_text, gpu_terms)
    perf_hits = count_signals(work_text, perf_terms)
    has_required_domain = inference_hits >= 2 and (gpu_hits + perf_hits) >= 2

    if not has_required_domain:
        score = 0
        risk_flags = [
            "insufficient_ai_inference_evidence",
            "insufficient_gpu_or_performance_evidence",
        ]
        feedback = (
            "Submission does not provide enough AI/LLM inference and "
            "GPU/performance optimization evidence for this task."
        )
    else:
        category_bonus = 10 if gpu_hits > 0 and perf_hits > 0 else 0
        score = bounded_score(
            inference_hits * 18 + gpu_hits * 14 + perf_hits * 10 + category_bonus
        )
        risk_flags = []
        feedback = (
            "Submission matches AI/LLM inference and GPU optimization signals "
            "from the task criteria."
        )

    return {
        "score": score,
        "grade": grade_from_score(score),
        "feedback": feedback,
        "strengths": [
            "URL format is valid",
            "Evaluation used deterministic task and submission signals",
        ],
        "improvements": [
            "Include specific files, pull requests, or benchmarks when possible",
            "Mention concrete inference and GPU optimization evidence",
        ],
        "criteria_scores": {
            "ai_llm_inference_serving": inference_score,
            "gpu_kernel_performance": gpu_score,
            "batching_quantization_memory": perf_score,
            "task_domain_relevance": 100 if has_required_domain else 0,
        },
        "url_valid": True,
        "risk_flags": risk_flags,
    }


def collect_general_terms(task_text: str) -> list:
    stopwords = [
        "submission",
        "submit",
        "must",
        "should",
        "score",
        "receive",
        "work",
        "task",
        "repo",
        "repository",
        "github",
        "link",
        "links",
        "with",
        "from",
        "that",
        "this",
        "about",
        "find",
        "verify",
        "describe",
        "description",
        "criteria",
    ]
    terms = []
    for token in task_text.split():
        word = token.strip()
        if len(word) < 4:
            continue
        if word in stopwords:
            continue
        duplicate = False
        for existing in terms:
            if existing == word:
                duplicate = True
        if not duplicate:
            terms.append(word)
        if len(terms) >= 10:
            break
    return terms


def evaluate_general_task(task_text: str, work_text: str, raw_task: str, raw_work: str) -> dict:
    repo_hint = extract_repo_hint(raw_task, raw_work)
    terms = collect_general_terms(task_text)
    term_score = keyword_score(work_text, terms)
    repo_score = 100 if repo_hint else 0

    score = term_score
    if repo_score == 100:
        score = max(score, 80)
        if term_score >= 35:
            score = max(score, 95)
    elif term_score < 25:
        score = 0

    return {
        "score": score,
        "grade": grade_from_score(score),
        "feedback": "Submission scored with deterministic overlap against task criteria.",
        "strengths": [
            "URL format is valid",
            "Evaluation avoids external fetch and validator LLM timeouts",
        ],
        "improvements": [
            "Add task-specific keywords in the submission description",
            "Use the exact repository requested by the task when applicable",
        ],
        "criteria_scores": {
            "repo_match": repo_score,
            "criteria_keyword_match": term_score,
            "task_fit": score,
        },
        "url_valid": True,
        "risk_flags": [] if score > 0 else ["low_task_relevance"],
    }


def fast_evaluate_submission(
    task_title: str,
    task_description: str,
    task_criteria: str,
    work_url: str,
    work_description: str,
) -> dict:
    raw_task = str(task_title + " " + task_description + " " + task_criteria).lower()
    raw_work = str(work_url + " " + work_description).lower()
    task_text = normalize_signal_text(raw_task)
    work_text = normalize_signal_text(raw_work)

    if not (
        raw_work.startswith("http://")
        or raw_work.startswith("https://")
        or raw_work.startswith("ipfs://")
    ):
        return make_evaluation_fallback("URL format is invalid.")

    ai_task_terms = [
        "ai",
        "llm",
        "inference",
        "gpu",
        "cuda",
        "hip",
        "kernel",
        "attention",
        "batching",
        "quantization",
        "memory",
    ]
    if count_signals(task_text, ai_task_terms) >= 3:
        return evaluate_ai_gpu_task(work_text, raw_work)

    return evaluate_general_task(task_text, work_text, raw_task, raw_work)


def is_license_verification_task(task_text: str) -> bool:
    normalized = normalize_signal_text(task_text)
    return count_signals(
        normalized,
        [
            "license",
            "licence",
            "license file",
            "license type",
            "license terms",
            "mit license",
            "apache license",
            "gpl",
            "copying",
        ],
    ) >= 1


def is_direct_license_url(work_url: str) -> bool:
    lowered = str(work_url).lower().split("?")[0].split("#")[0]
    parts = lowered.replace("\\", "/").split("/")
    filename = parts[-1] if len(parts) > 0 else lowered
    return (
        filename == "license"
        or filename == "licence"
        or filename == "copying"
        or filename == "notice"
        or filename.startswith("license.")
        or filename.startswith("licence.")
        or filename.startswith("copying.")
        or filename.startswith("notice.")
        or "license" in filename
        or "licence" in filename
    )


def content_has_full_license_terms(url_content: str) -> bool:
    content = str(url_content).lower()
    title_hit = (
        "mit license" in content
        or "apache license" in content
        or "gnu general public license" in content
        or "bsd license" in content
        or "mozilla public license" in content
    )
    terms_hit = (
        "permission is hereby granted" in content
        or "limitations under the license" in content
        or "redistribution and use" in content
        or "without warranty" in content
    )
    return title_hit and terms_hit


def apply_evidence_gates(
    result: dict,
    task_title: str,
    task_description: str,
    task_criteria: str,
    work_url: str,
    url_content: str,
) -> dict:
    task_text = str(task_title + " " + task_description + " " + task_criteria)

    if is_license_verification_task(task_text):
        if not is_direct_license_url(work_url):
            result["score"] = 0
            result["grade"] = "F"
            result["feedback"] = (
                "Submission is not a direct license file. A source file or "
                "README that only references a license is not enough evidence "
                "for this license verification task."
            )
            criteria_scores = result.get("criteria_scores", {})
            if not isinstance(criteria_scores, dict):
                criteria_scores = {}
            criteria_scores["direct_license_file"] = 0
            criteria_scores["license_terms_present"] = 0
            result["criteria_scores"] = criteria_scores

            flags = result.get("risk_flags", [])
            if not isinstance(flags, list):
                flags = []
            flags.append("not_direct_license_file")
            result["risk_flags"] = flags
            return result

        if not content_has_full_license_terms(url_content):
            result["score"] = min(int(result.get("score", 0)), 30)
            result["grade"] = grade_from_score(int(result["score"]))
            result["feedback"] = (
                "The URL looks like a license file, but the fetched content "
                "does not contain enough full license terms for a strong score."
            )
            flags = result.get("risk_flags", [])
            if not isinstance(flags, list):
                flags = []
            flags.append("missing_full_license_terms")
            result["risk_flags"] = flags

    return result


def precheck_evidence_rejection(
    task_title: str,
    task_description: str,
    task_criteria: str,
    work_url: str,
) -> dict:
    task_text = str(task_title + " " + task_description + " " + task_criteria)
    if is_license_verification_task(task_text) and not is_direct_license_url(work_url):
        return {
            "score": 0,
            "grade": "F",
            "feedback": (
                "Submission is not a direct license file. A source file, README, "
                "or other document that only references a license is not valid "
                "evidence for this task."
            ),
            "strengths": ["URL format is valid"],
            "improvements": [
                "Submit a direct raw LICENSE, LICENCE, COPYING, or NOTICE file",
                "Include the full license terms in the submitted evidence",
            ],
            "criteria_scores": {
                "direct_license_file": 0,
                "license_terms_present": 0,
                "task_fit": 0,
            },
            "url_valid": True,
            "risk_flags": ["not_direct_license_file"],
        }
    return {}


def smart_evaluate_submission(
    task_title: str,
    task_description: str,
    task_criteria: str,
    reward_points: int,
    work_url: str,
    work_description: str,
) -> dict:
    precheck = precheck_evidence_rejection(
        task_title,
        task_description,
        task_criteria,
        work_url,
    )
    if precheck:
        return precheck

    def run_ai_review() -> dict:
        url_content = ""
        try:
            rendered = gl.nondet.web.render(work_url, mode="text")
            url_content = str(rendered)[:MAX_FETCHED_CONTENT_LENGTH]
        except Exception:
            url_content = ""

        if not url_content.strip():
            url_content = "URL content unavailable or empty during review."

        prompt = build_evaluation_prompt(
            task_title,
            task_description,
            task_criteria,
            reward_points,
            work_url,
            work_description,
            url_content,
        )
        raw_result = gl.nondet.exec_prompt(prompt, response_format="json")
        result = parse_evaluation_result(raw_result)
        result = apply_evidence_gates(
            result,
            task_title,
            task_description,
            task_criteria,
            work_url,
            url_content,
        )

        if not result.get("url_valid", False):
            result["score"] = min(int(result.get("score", 0)), 30)
            result["grade"] = grade_from_score(int(result["score"]))

        return result

    def validate_ai_review(leaders_res: gl.vm.Result) -> bool:
        if not isinstance(leaders_res, gl.vm.Return):
            return False

        leader_result = parse_evaluation_result(leaders_res.calldata)
        validator_result = run_ai_review()
        return evaluation_matches(leader_result, validator_result)

    return gl.vm.run_nondet_unsafe(run_ai_review, validate_ai_review)


class ProofOfImpact(gl.Contract):
    task_storage: TreeMap[str, str]
    submission_storage: TreeMap[str, str]
    score_storage: TreeMap[str, u256]
    contributor_points: TreeMap[str, u256]
    task_submissions_json: TreeMap[str, str]
    worker_submissions_json: TreeMap[str, str]
    worker_task_submission: TreeMap[str, str]
    task_awarded_points: TreeMap[str, u256]
    task_pending_submissions: TreeMap[str, u256]
    task_evaluated_submissions: TreeMap[str, u256]
    creator_task_count: TreeMap[str, u256]
    worker_submission_count: TreeMap[str, u256]
    evaluator_review_count: TreeMap[str, u256]
    evaluator_last_submission: TreeMap[str, str]
    task_count: u256
    submission_count: u256
    evaluated_count: u256
    total_points_awarded: u256
    active_task_count: u256
    paused: u256
    owner: Address
    task_manager_contract: Address
    leaderboard_contract: Address

    def __init__(self, task_manager_address: Address, leaderboard_address: Address):
        self.owner = gl.message.sender_address
        self.task_manager_contract = task_manager_address
        self.leaderboard_contract = leaderboard_address
        self.task_count = u256(0)
        self.submission_count = u256(0)
        self.evaluated_count = u256(0)
        self.total_points_awarded = u256(0)
        self.active_task_count = u256(0)
        self.paused = u256(0)

    def _sender(self) -> str:
        return normalize_address(str(gl.message.sender_address))

    def _is_owner(self) -> bool:
        return gl.message.sender_address == self.owner

    def _require_owner(self) -> None:
        if not self._is_owner():
            raise gl.vm.UserError("only owner")

    def _is_paused(self) -> bool:
        return int(self.paused) > 0

    def _require_not_paused(self) -> None:
        if self._is_paused():
            raise gl.vm.UserError("contract is paused")

    def _task_manager_is_set(self) -> bool:
        return str(self.task_manager_contract).lower() != ZERO_ADDRESS

    def _task_manager(self):
        if not self._task_manager_is_set():
            raise gl.vm.UserError("task manager is not set")
        return gl.get_contract_at(self.task_manager_contract)

    def _get_task(self, task_id: str) -> dict:
        if self._task_manager_is_set():
            raw_task = self._task_manager().view().get_task(task_id)
            if not raw_task:
                raise gl.vm.UserError("task not found")
            return safe_json_load(str(raw_task))

        if task_id not in self.task_storage:
            raise gl.vm.UserError("task not found")
        return safe_json_load(self.task_storage[task_id])

    def _get_submission(self, sub_id: str) -> dict:
        if sub_id not in self.submission_storage:
            raise gl.vm.UserError("submission not found")
        return safe_json_load(self.submission_storage[sub_id])

    def _store_task(self, task_id: str, task_data: dict) -> None:
        self.task_storage[task_id] = json.dumps(task_data, sort_keys=True)

    def _store_submission(self, sub_id: str, sub_data: dict) -> None:
        self.submission_storage[sub_id] = json.dumps(sub_data, sort_keys=True)

    def _require_task_manager(self, task_data: dict) -> None:
        sender = self._sender()
        creator = normalize_address(str(task_data.get("creator", "")))
        if sender != creator and not self._is_owner():
            raise gl.vm.UserError("only task creator or owner")

    def _worker_task_key(self, task_id: str, worker: str) -> str:
        return task_id + "::" + normalize_address(worker)

    def _has_blocking_submission(self, task_id: str, worker: str) -> bool:
        key = self._worker_task_key(task_id, worker)
        if key not in self.worker_task_submission:
            return False

        existing_id = self.worker_task_submission[key]
        if existing_id not in self.submission_storage:
            return False

        existing = self._get_submission(existing_id)
        return existing.get("status", "") in {SUBMISSION_PENDING, SUBMISSION_EVALUATED}

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

    def _leaderboard_is_set(self) -> bool:
        return str(self.leaderboard_contract).lower() != ZERO_ADDRESS

    def _record_task_submission(self, task_id: str, sub_id: str, worker: str) -> None:
        if self._task_manager_is_set():
            self._task_manager().emit(on="accepted").record_submission(
                task_id,
                sub_id,
                worker,
            )

    def _record_task_withdrawal(self, task_id: str) -> None:
        if self._task_manager_is_set():
            self._task_manager().emit(on="accepted").record_withdrawal(task_id)

    def _record_task_evaluation(self, task_id: str, points_awarded: int) -> None:
        if self._task_manager_is_set():
            self._task_manager().emit(on="accepted").record_evaluation(
                task_id,
                u256(points_awarded),
            )

    def _award_points(self, task_id: str, worker: str, points: int) -> None:
        if points <= 0:
            return

        normalized_worker = normalize_address(worker)
        current_worker = (
            int(self.contributor_points[normalized_worker])
            if normalized_worker in self.contributor_points
            else 0
        )
        self.contributor_points[normalized_worker] = u256(current_worker + points)

        current_task = (
            int(self.task_awarded_points[task_id])
            if task_id in self.task_awarded_points
            else 0
        )
        self.task_awarded_points[task_id] = u256(current_task + points)
        self.total_points_awarded = u256(int(self.total_points_awarded) + points)

        if self._leaderboard_is_set():
            leaderboard = gl.get_contract_at(self.leaderboard_contract)
            leaderboard.emit(on="accepted").record_score(
                normalized_worker,
                u256(points),
            )

    @gl.public.write
    def transfer_ownership(self, new_owner: Address) -> None:
        self._require_owner()
        self.owner = new_owner

    @gl.public.write
    def set_paused(self, paused: u256) -> None:
        self._require_owner()
        self.paused = u256(1) if paused > u256(0) else u256(0)

    @gl.public.write
    def set_leaderboard_contract(self, leaderboard_address: Address) -> None:
        self._require_owner()
        self.leaderboard_contract = leaderboard_address

    @gl.public.write
    def set_task_manager_contract(self, task_manager_address: Address) -> None:
        self._require_owner()
        self.task_manager_contract = task_manager_address

    @gl.public.write
    def create_task(
        self,
        title: str,
        description: str,
        criteria: str,
        reward_points: u256,
    ) -> str:
        self._require_not_paused()
        if self._task_manager_is_set():
            raise gl.vm.UserError("create tasks through TaskManager")

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

        creator = self._sender()
        task_id = "task-" + str(self.task_count)
        task_dict = {
            "task_id": task_id,
            "title": clean_title,
            "description": clean_description,
            "criteria": clean_criteria,
            "reward_points": int(reward_points),
            "status": TASK_OPEN,
            "creator": creator,
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
        self._increment_map_counter(self.creator_task_count, creator, 1)

        self.task_count = u256(int(self.task_count) + 1)
        self.active_task_count = u256(int(self.active_task_count) + 1)
        return task_id

    @gl.public.write
    def update_task_metadata(
        self,
        task_id: str,
        title: str,
        description: str,
        criteria: str,
    ) -> None:
        self._require_not_paused()
        if self._task_manager_is_set():
            raise gl.vm.UserError("update tasks through TaskManager")
        task_data = self._get_task(task_id)
        self._require_task_manager(task_data)

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
        if self._task_manager_is_set():
            raise gl.vm.UserError("close tasks through TaskManager")
        task_data = self._get_task(task_id)
        self._require_task_manager(task_data)
        if task_data.get("status", "") != TASK_OPEN:
            raise gl.vm.UserError("task is not open")
        self._set_task_status(task_id, task_data, TASK_CLOSED)

    @gl.public.write
    def reopen_task(self, task_id: str) -> None:
        self._require_not_paused()
        if self._task_manager_is_set():
            raise gl.vm.UserError("reopen tasks through TaskManager")
        task_data = self._get_task(task_id)
        self._require_task_manager(task_data)
        if task_data.get("status", "") != TASK_CLOSED:
            raise gl.vm.UserError("only closed tasks can be reopened")
        self._set_task_status(task_id, task_data, TASK_OPEN)

    @gl.public.write
    def cancel_task(self, task_id: str, reason: str) -> None:
        if self._task_manager_is_set():
            raise gl.vm.UserError("cancel tasks through TaskManager")
        task_data = self._get_task(task_id)
        self._require_task_manager(task_data)
        if task_data.get("status", "") == TASK_CANCELLED:
            raise gl.vm.UserError("task already cancelled")

        task_data["cancel_reason"] = validate_text(reason, "reason", 300)
        self._set_task_status(task_id, task_data, TASK_CANCELLED)

    @gl.public.write
    def submit_work(
        self,
        task_id: str,
        work_url: str,
        description: str,
    ) -> str:
        self._require_not_paused()

        task_data = self._get_task(task_id)
        if task_data.get("status", "") != TASK_OPEN:
            raise gl.vm.UserError("task is not open")

        worker = self._sender()
        if self._has_blocking_submission(task_id, worker):
            raise gl.vm.UserError("worker already submitted for this task")

        clean_url = validate_url(work_url)
        clean_description = validate_text(
            description,
            "description",
            MAX_SUBMISSION_DESCRIPTION_LENGTH,
        )

        sub_id = "sub-" + str(self.submission_count)
        sub_dict = {
            "sub_id": sub_id,
            "task_id": task_id,
            "worker": worker,
            "work_url": clean_url,
            "description": clean_description,
            "status": SUBMISSION_PENDING,
            "revision": 1,
        }

        self._store_submission(sub_id, sub_dict)
        self.score_storage[sub_id] = u256(0)

        self.task_submissions_json[task_id] = append_json_array(
            self.task_submissions_json[task_id]
            if task_id in self.task_submissions_json
            else "[]",
            sub_id,
        )
        self.worker_submissions_json[worker] = append_json_array(
            self.worker_submissions_json[worker] if worker in self.worker_submissions_json else "",
            sub_id,
        )
        self.worker_task_submission[self._worker_task_key(task_id, worker)] = sub_id

        self._increment_map_counter(self.worker_submission_count, worker, 1)

        if self._task_manager_is_set():
            self._record_task_submission(task_id, sub_id, worker)
        else:
            self._increment_map_counter(self.task_pending_submissions, task_id, 1)
            task_data["submission_count"] = int(task_data.get("submission_count", 0)) + 1
            self._store_task(task_id, task_data)

        self.submission_count = u256(int(self.submission_count) + 1)
        return sub_id

    @gl.public.write
    def revise_submission(
        self,
        sub_id: str,
        work_url: str,
        description: str,
    ) -> None:
        self._require_not_paused()

        sub_data = self._get_submission(sub_id)
        if sub_data.get("status", "") != SUBMISSION_PENDING:
            raise gl.vm.UserError("only pending submissions can be revised")
        if normalize_address(sub_data.get("worker", "")) != self._sender():
            raise gl.vm.UserError("only worker can revise submission")

        task_data = self._get_task(sub_data["task_id"])
        if task_data.get("status", "") != TASK_OPEN:
            raise gl.vm.UserError("task is not open")

        sub_data["work_url"] = validate_url(work_url)
        sub_data["description"] = validate_text(
            description,
            "description",
            MAX_SUBMISSION_DESCRIPTION_LENGTH,
        )
        sub_data["revision"] = int(sub_data.get("revision", 1)) + 1
        self._store_submission(sub_id, sub_data)

    @gl.public.write
    def withdraw_submission(self, sub_id: str) -> None:
        sub_data = self._get_submission(sub_id)
        if sub_data.get("status", "") != SUBMISSION_PENDING:
            raise gl.vm.UserError("only pending submissions can be withdrawn")
        if normalize_address(sub_data.get("worker", "")) != self._sender():
            raise gl.vm.UserError("only worker can withdraw submission")

        task_id = sub_data["task_id"]
        worker = normalize_address(sub_data["worker"])
        sub_data["status"] = SUBMISSION_WITHDRAWN
        self._store_submission(sub_id, sub_data)

        if self._task_manager_is_set():
            self._record_task_withdrawal(task_id)
        else:
            self._decrement_map_counter(self.task_pending_submissions, task_id)
        self.worker_task_submission[self._worker_task_key(task_id, worker)] = (
            "withdrawn:" + sub_id
        )

    @gl.public.write
    def evaluate_submission(self, sub_id: str) -> str:
        self._require_not_paused()

        sub_data = self._get_submission(sub_id)
        if sub_data.get("status", "") != SUBMISSION_PENDING:
            raise gl.vm.UserError("submission is not pending")

        task_data = self._get_task(sub_data["task_id"])
        if task_data.get("status", "") == TASK_CANCELLED:
            raise gl.vm.UserError("task is cancelled")

        task_title = str(task_data["title"])
        task_description = str(task_data["description"])
        task_criteria = str(task_data["criteria"])
        work_url = str(sub_data["work_url"])
        work_description = str(sub_data["description"])
        task_reward = int(task_data["reward_points"])

        result = smart_evaluate_submission(
            task_title,
            task_description,
            task_criteria,
            task_reward,
            work_url,
            work_description,
        )
        score = int(result["score"])
        points_earned = (task_reward * score) // 100
        worker = normalize_address(str(sub_data["worker"]))
        evaluator = self._sender()
        task_id = str(sub_data["task_id"])

        self.score_storage[sub_id] = u256(score)
        self._award_points(task_id, worker, points_earned)
        if self._task_manager_is_set():
            self._record_task_evaluation(task_id, points_earned)
        else:
            self._decrement_map_counter(self.task_pending_submissions, task_id)
            self._increment_map_counter(self.task_evaluated_submissions, task_id, 1)
        self._increment_map_counter(self.evaluator_review_count, evaluator, 1)
        self.evaluator_last_submission[evaluator] = sub_id

        self.evaluated_count = u256(int(self.evaluated_count) + 1)

        sub_data["status"] = SUBMISSION_EVALUATED
        sub_data["score"] = score
        sub_data["grade"] = result["grade"]
        sub_data["feedback"] = result["feedback"]
        sub_data["strengths"] = result["strengths"]
        sub_data["improvements"] = result["improvements"]
        sub_data["criteria_scores"] = result["criteria_scores"]
        sub_data["url_valid"] = result["url_valid"]
        sub_data["risk_flags"] = result["risk_flags"]
        sub_data["points_earned"] = points_earned
        sub_data["evaluated_by"] = evaluator
        self._store_submission(sub_id, sub_data)

        if not self._task_manager_is_set():
            task_data["evaluated_count"] = int(task_data.get("evaluated_count", 0)) + 1
            task_data["awarded_points"] = (
                int(task_data.get("awarded_points", 0)) + points_earned
            )
            self._store_task(task_id, task_data)

        return json.dumps(result, sort_keys=True)

    @gl.public.write
    def sync_leaderboard_score(self, contributor: str) -> None:
        self._require_owner()
        if not self._leaderboard_is_set():
            raise gl.vm.UserError("leaderboard is not set")

        normalized = normalize_address(contributor)
        points = (
            self.contributor_points[normalized]
            if normalized in self.contributor_points
            else u256(0)
        )
        leaderboard = gl.get_contract_at(self.leaderboard_contract)
        leaderboard.emit(on="accepted").set_score(normalized, points)

    @gl.public.view
    def get_task(self, task_id: str) -> str:
        if self._task_manager_is_set():
            return str(self._task_manager().view().get_task(task_id))
        return self.task_storage[task_id] if task_id in self.task_storage else ""

    @gl.public.view
    def get_submission(self, sub_id: str) -> str:
        return self.submission_storage[sub_id] if sub_id in self.submission_storage else ""

    @gl.public.view
    def get_score(self, sub_id: str) -> u256:
        if sub_id not in self.score_storage:
            return u256(0)
        return self.score_storage[sub_id]

    @gl.public.view
    def get_leaderboard_score(self, address: str) -> u256:
        normalized = normalize_address(address)
        if normalized not in self.contributor_points:
            return u256(0)
        return self.contributor_points[normalized]

    @gl.public.view
    def get_task_submissions(self, task_id: str) -> str:
        if self._task_manager_is_set():
            return str(self._task_manager().view().get_task_submissions(task_id))
        if task_id not in self.task_submissions_json:
            return "[]"
        return self.task_submissions_json[task_id]

    @gl.public.view
    def get_worker_submissions(self, worker: str) -> str:
        normalized = normalize_address(worker)
        if normalized not in self.worker_submissions_json:
            return "[]"
        return self.worker_submissions_json[normalized]

    @gl.public.view
    def get_worker_task_submission(self, task_id: str, worker: str) -> str:
        key = self._worker_task_key(task_id, worker)
        if key not in self.worker_task_submission:
            return ""
        return self.worker_task_submission[key]

    @gl.public.view
    def get_submission_evaluation(self, sub_id: str) -> str:
        if sub_id not in self.submission_storage:
            return "{}"
        sub_data = safe_json_load(self.submission_storage[sub_id])
        if sub_data.get("status", "") != SUBMISSION_EVALUATED:
            return "{}"
        return json.dumps(
            {
                "score": sub_data.get("score", 0),
                "grade": sub_data.get("grade", "F"),
                "feedback": sub_data.get("feedback", ""),
                "strengths": sub_data.get("strengths", []),
                "improvements": sub_data.get("improvements", []),
                "criteria_scores": sub_data.get("criteria_scores", {}),
                "url_valid": sub_data.get("url_valid", False),
                "risk_flags": sub_data.get("risk_flags", []),
                "points_earned": sub_data.get("points_earned", 0),
                "evaluated_by": sub_data.get("evaluated_by", ""),
            },
            sort_keys=True,
        )

    @gl.public.view
    def can_submit(self, task_id: str, worker: str) -> str:
        raw_task = self.get_task(task_id)
        if not raw_task:
            return json.dumps({"ok": False, "reason": "task not found"})
        if self._is_paused():
            return json.dumps({"ok": False, "reason": "contract is paused"})

        task_data = safe_json_load(raw_task)
        if task_data.get("status", "") != TASK_OPEN:
            return json.dumps({"ok": False, "reason": "task is not open"})

        normalized = normalize_address(worker)
        if self._has_blocking_submission(task_id, normalized):
            return json.dumps({"ok": False, "reason": "worker already submitted"})

        return json.dumps({"ok": True, "reason": ""})

    @gl.public.view
    def get_task_stats(self, task_id: str) -> str:
        if self._task_manager_is_set():
            return str(self._task_manager().view().get_task_stats(task_id))
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
        task_count = int(self.task_count)
        active_task_count = int(self.active_task_count)
        if self._task_manager_is_set():
            task_count = int(self._task_manager().view().get_task_count())
            active_task_count = int(self._task_manager().view().get_active_task_count())

        return json.dumps(
            {
                "version": CONTRACT_VERSION,
                "task_count": task_count,
                "active_task_count": active_task_count,
                "submission_count": int(self.submission_count),
                "evaluated_count": int(self.evaluated_count),
                "total_points_awarded": int(self.total_points_awarded),
                "paused": self._is_paused(),
                "task_manager_contract": str(self.task_manager_contract),
                "leaderboard_contract": str(self.leaderboard_contract),
                "owner": str(self.owner),
            },
            sort_keys=True,
        )

    @gl.public.view
    def get_creator_task_count(self, creator: str) -> u256:
        if self._task_manager_is_set():
            return self._task_manager().view().get_creator_task_count(creator)
        normalized = normalize_address(creator)
        if normalized not in self.creator_task_count:
            return u256(0)
        return self.creator_task_count[normalized]

    @gl.public.view
    def get_worker_submission_count(self, worker: str) -> u256:
        normalized = normalize_address(worker)
        if normalized not in self.worker_submission_count:
            return u256(0)
        return self.worker_submission_count[normalized]

    @gl.public.view
    def get_evaluator_review_count(self, evaluator: str) -> u256:
        normalized = normalize_address(evaluator)
        if normalized not in self.evaluator_review_count:
            return u256(0)
        return self.evaluator_review_count[normalized]

    @gl.public.view
    def get_task_awarded_points(self, task_id: str) -> u256:
        if self._task_manager_is_set():
            return self._task_manager().view().get_task_awarded_points(task_id)
        if task_id not in self.task_awarded_points:
            return u256(0)
        return self.task_awarded_points[task_id]

    @gl.public.view
    def get_task_pending_count(self, task_id: str) -> u256:
        if self._task_manager_is_set():
            return self._task_manager().view().get_task_pending_count(task_id)
        if task_id not in self.task_pending_submissions:
            return u256(0)
        return self.task_pending_submissions[task_id]

    @gl.public.view
    def get_task_evaluated_count(self, task_id: str) -> u256:
        if self._task_manager_is_set():
            return self._task_manager().view().get_task_evaluated_count(task_id)
        if task_id not in self.task_evaluated_submissions:
            return u256(0)
        return self.task_evaluated_submissions[task_id]

    @gl.public.view
    def get_task_count(self) -> u256:
        if self._task_manager_is_set():
            return self._task_manager().view().get_task_count()
        return self.task_count

    @gl.public.view
    def get_submission_count(self) -> u256:
        return self.submission_count

    @gl.public.view
    def get_evaluated_count(self) -> u256:
        return self.evaluated_count

    @gl.public.view
    def get_total_points_awarded(self) -> u256:
        return self.total_points_awarded

    @gl.public.view
    def get_active_task_count(self) -> u256:
        if self._task_manager_is_set():
            return self._task_manager().view().get_active_task_count()
        return self.active_task_count

    @gl.public.view
    def is_paused(self) -> u256:
        return self.paused

    @gl.public.view
    def get_owner(self) -> str:
        return str(self.owner)

    @gl.public.view
    def get_leaderboard_contract(self) -> str:
        return str(self.leaderboard_contract)

    @gl.public.view
    def get_task_manager_contract(self) -> str:
        return str(self.task_manager_contract)

    @gl.public.view
    def get_version(self) -> str:
        return CONTRACT_VERSION
