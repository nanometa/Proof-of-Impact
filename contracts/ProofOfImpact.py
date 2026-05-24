# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
import json


def validate_not_empty(value: str, field_name: str) -> None:
    if not value or not value.strip():
        raise gl.vm.UserError(f"{field_name} cannot be empty")


def build_evaluation_prompt(
    task_title: str,
    task_description: str,
    task_criteria: str,
    work_url: str,
    work_description: str,
    url_content: str,
) -> str:
    return (
        "You are an expert evaluator for a decentralized work platform. "
        "Evaluate the submitted work against the task criteria.\n\n"
        f"Task Title: {task_title}\n"
        f"Task Description: {task_description}\n"
        f"Evaluation Criteria: {task_criteria}\n\n"
        f"Submitted Work URL: {work_url}\n"
        f"Worker Description: {work_description}\n\n"
        f"Actual content fetched from the URL:\n{url_content}\n\n"
        "IMPORTANT RULES:\n"
        "- If the URL could not be fetched or content is empty, penalize heavily (score <= 30).\n"
        "- If the content does NOT match the worker description, penalize (score <= 50).\n"
        "- If the content matches the description and satisfies the criteria, reward accordingly.\n"
        "- Base your evaluation primarily on the fetched content, not just the description.\n\n"
        "Respond with a JSON object containing:\n"
        '- "score": integer from 0 to 100\n'
        '- "grade": one of "A", "B", "C", "D", "F"\n'
        '- "feedback": a non-empty string summarizing the evaluation\n'
        '- "strengths": a list of at least 2 strings describing strengths\n'
        '- "improvements": a list of at least 2 strings describing areas for improvement\n'
        '- "criteria_scores": a dictionary mapping criterion names to integer scores 0-100\n'
        '- "url_valid": true if URL was accessible and relevant, false otherwise\n\n'
        "Return ONLY the JSON object, no additional text."
    )


def parse_evaluation_result(raw: str) -> dict:
    fallback = {
        "score":           0,
        "grade":           "F",
        "feedback":        "Could not parse evaluation result.",
        "strengths":       ["Submission received", "URL provided"],
        "improvements":    ["Work could not be evaluated", "Please resubmit"],
        "criteria_scores": {"overall": 0},
        "url_valid":       False,
    }
    try:
        cleaned = raw.replace("```json", "").replace("```", "").strip()
        s = cleaned.find("{")
        e = cleaned.rfind("}") + 1
        if s >= 0 and e > s:
            cleaned = cleaned[s:e]
        result = json.loads(cleaned)
    except Exception:
        return fallback

    if not isinstance(result, dict):
        return fallback

    try:
        score = max(0, min(100, int(result.get("score", 0))))
    except Exception:
        score = 0

    grade = result.get("grade", "F")
    if grade not in {"A", "B", "C", "D", "F"}:
        grade = "F"

    feedback = result.get("feedback", "")
    if not isinstance(feedback, str) or not feedback.strip():
        feedback = "No feedback provided."

    strengths = result.get("strengths", [])
    if not isinstance(strengths, list) or len(strengths) < 2:
        strengths = ["Work submitted", "URL provided"]

    improvements = result.get("improvements", [])
    if not isinstance(improvements, list) or len(improvements) < 2:
        improvements = ["Could be improved", "More detail needed"]

    criteria_scores = result.get("criteria_scores", {})
    if not isinstance(criteria_scores, dict):
        criteria_scores = {"overall": score}

    cleaned_criteria = {}
    for key, val in criteria_scores.items():
        try:
            cleaned_criteria[str(key)] = max(0, min(100, int(val)))
        except Exception:
            cleaned_criteria[str(key)] = 0

    return {
        "score":           score,
        "grade":           grade,
        "feedback":        feedback,
        "strengths":       strengths,
        "improvements":    improvements,
        "criteria_scores": cleaned_criteria,
        "url_valid":       bool(result.get("url_valid", False)),
    }


class ProofOfImpact(gl.Contract):
    task_storage:       TreeMap[str, str]
    submission_storage: TreeMap[str, str]
    score_storage:      TreeMap[str, u256]
    contributor_points: TreeMap[str, u256]
    task_count:         u256
    submission_count:   u256
    owner:              Address

    def __init__(self):
        self.task_count       = u256(0)
        self.submission_count = u256(0)
        self.owner            = gl.message.sender_address

    @gl.public.write
    def create_task(self, title: str, description: str,
                    criteria: str, reward_points: u256) -> str:
        validate_not_empty(title,       "title")
        validate_not_empty(description, "description")
        validate_not_empty(criteria,    "criteria")
        if reward_points <= u256(0):
            raise gl.vm.UserError("reward_points must be greater than 0")

        task_id   = "task-" + str(self.task_count)
        task_dict = {
            "task_id":       task_id,
            "title":         title,
            "description":   description,
            "criteria":      criteria,
            "reward_points": int(reward_points),
            "status":        "open",
            "creator":       str(gl.message.sender_address),
        }
        self.task_storage[task_id] = json.dumps(task_dict, sort_keys=True)
        self.task_count = u256(int(self.task_count) + 1)
        return task_id

    @gl.public.write
    def submit_work(self, task_id: str, work_url: str,
                    description: str) -> str:
        if task_id not in self.task_storage:
            raise gl.vm.UserError("task not found")
        task_data = json.loads(self.task_storage[task_id])
        if task_data["status"] != "open":
            raise gl.vm.UserError("task is not open")
        if not work_url or len(work_url) > 256:
            raise gl.vm.UserError("work_url must be 1-256 characters")
        if not description or len(description) > 1024:
            raise gl.vm.UserError("description must be 1-1024 characters")

        sub_id   = "sub-" + str(self.submission_count)
        sub_dict = {
            "sub_id":      sub_id,
            "task_id":     task_id,
            "worker":      str(gl.message.sender_address),
            "work_url":    work_url,
            "description": description,
            "status":      "pending",
        }
        self.submission_storage[sub_id] = json.dumps(sub_dict, sort_keys=True)
        self.submission_count = u256(int(self.submission_count) + 1)
        return sub_id

    @gl.public.write
    def evaluate_submission(self, sub_id: str) -> str:
        if sub_id not in self.submission_storage:
            raise gl.vm.UserError("submission not found")

        sub_data = json.loads(self.submission_storage[sub_id])
        if sub_data["status"] == "evaluated":
            raise gl.vm.UserError("submission already evaluated")

        task_data  = json.loads(self.task_storage[sub_data["task_id"]])
        t_title    = task_data["title"]
        t_desc     = task_data["description"]
        t_criteria = task_data["criteria"]
        w_url      = sub_data["work_url"]
        w_desc     = sub_data["description"]
        parse_fn   = parse_evaluation_result
        build_fn   = build_evaluation_prompt

        def evaluate_single_source() -> str:
            try:
                url_content = gl.nondet.web.render(w_url, mode="text")[:600]
            except Exception:
                url_content = "URL could not be fetched or is inaccessible."

            try:
                prompt   = build_fn(t_title, t_desc, t_criteria,
                                    w_url, w_desc, url_content)
                response = gl.nondet.exec_prompt(prompt)
                payload  = parse_fn(response)
            except Exception:
                payload = {
                    "score":           0,
                    "grade":           "F",
                    "feedback":        "Evaluation failed unexpectedly.",
                    "strengths":       ["Submission received", "URL provided"],
                    "improvements":    ["Could not evaluate", "Please resubmit"],
                    "criteria_scores": {"overall": 0},
                    "url_valid":       False,
                }

            return json.dumps(payload, sort_keys=True)

        result_json = gl.eq_principle.prompt_comparative(
            evaluate_single_source,
            principle=(
                "score must be within 5 points. "
                "grade must match exactly. "
                "url_valid must match exactly."
            )
        )

        result         = json.loads(result_json)
        score          = int(result.get("score", 0))
        worker_address = sub_data["worker"]

        self.score_storage[sub_id] = u256(score)

        task_reward    = int(task_data["reward_points"])
        points_earned  = (task_reward * score) // 100

        current_points = int(self.contributor_points[worker_address]) \
                         if worker_address in self.contributor_points else 0
        self.contributor_points[worker_address] = u256(current_points + points_earned)

        sub_data["status"]    = "evaluated"
        sub_data["score"]     = score
        sub_data["grade"]     = result.get("grade", "F")
        sub_data["feedback"]  = result.get("feedback", "")
        sub_data["url_valid"] = result.get("url_valid", False)
        self.submission_storage[sub_id] = json.dumps(sub_data, sort_keys=True)

        return result_json

    @gl.public.view
    def get_task(self, task_id: str) -> str:
        if task_id not in self.task_storage:
            raise gl.vm.UserError("task not found")
        return self.task_storage[task_id]

    @gl.public.view
    def get_submission(self, sub_id: str) -> str:
        if sub_id not in self.submission_storage:
            raise gl.vm.UserError("submission not found")
        return self.submission_storage[sub_id]

    @gl.public.view
    def get_score(self, sub_id: str) -> u256:
        if sub_id not in self.score_storage:
            raise gl.vm.UserError("score not found")
        return self.score_storage[sub_id]

    @gl.public.view
    def get_leaderboard_score(self, address: str) -> u256:
        if address not in self.contributor_points:
            return u256(0)
        return self.contributor_points[address]

    @gl.public.view
    def get_task_count(self) -> u256:
        return self.task_count

    @gl.public.view
    def get_submission_count(self) -> u256:
        return self.submission_count
