import json
from genlayer import *


class ProofOfImpact(gl.Contract):
    task_storage: TreeMap[str, str]
    submission_storage: TreeMap[str, str]
    score_storage: TreeMap[str, u256]
    contributor_points: TreeMap[str, u256]
    task_count: u256
    submission_count: u256
    owner: Address

    def __init__(self):
        self.task_count = u256(0)
        self.submission_count = u256(0)
        self.owner = gl.message.sender_address

    @gl.public.write
    def create_task(self, title: str, description: str, criteria: str, reward_points: u256) -> str:
        if not title or not title.strip():
            raise gl.vm.UserError("title cannot be empty")
        if not description or not description.strip():
            raise gl.vm.UserError("description cannot be empty")
        if not criteria or not criteria.strip():
            raise gl.vm.UserError("criteria cannot be empty")
        if reward_points <= u256(0):
            raise gl.vm.UserError("reward_points must be > 0")

        task_id = "task-" + str(self.task_count)
        task_dict = {
            "task_id": task_id,
            "title": title,
            "description": description,
            "criteria": criteria,
            "reward_points": int(reward_points),
            "status": "open",
            "creator": str(gl.message.sender_address),
        }
        self.task_storage[task_id] = json.dumps(task_dict, sort_keys=True)
        self.task_count = u256(int(self.task_count) + 1)
        return task_id

    @gl.public.write
    def submit_work(self, task_id: str, work_url: str, description: str) -> str:
        if task_id not in self.task_storage:
            raise gl.vm.UserError("task not found")
        task_data = json.loads(self.task_storage[task_id])
        if task_data["status"] != "open":
            raise gl.vm.UserError("task is not open")
        if not work_url or len(work_url) > 256:
            raise gl.vm.UserError("work_url must be 1-256 characters")
        if not description or len(description) > 1024:
            raise gl.vm.UserError("description must be 1-1024 characters")

        sub_id = "sub-" + str(self.submission_count)
        sub_dict = {
            "sub_id": sub_id,
            "task_id": task_id,
            "worker": str(gl.message.sender_address),
            "work_url": work_url,
            "description": description,
            "status": "pending",
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
            raise gl.vm.UserError("already evaluated")

        task_data = json.loads(self.task_storage[sub_data["task_id"]])

        def evaluate():
            prompt = (
                f"Evaluate this work:\nTask: {task_data['title']}\n"
                f"Criteria: {task_data['criteria']}\n"
                f"Work URL: {sub_data['work_url']}\n"
                f"Description: {sub_data['description']}\n\n"
                "Return JSON: {\"score\":0-100,\"grade\":\"A/B/C/D/F\","
                "\"feedback\":\"...\",\"strengths\":[...],\"improvements\":[...],"
                "\"criteria_scores\":{...}}"
            )
            return gl.nondet.exec_prompt(prompt)

        result_json = gl.eq_principle.prompt_comparative(
            evaluate,
            principle="score within 5 points, grade must match"
        )

        result = json.loads(result_json)
        score = int(result["score"])
        self.score_storage[sub_id] = u256(score)

        worker = sub_data["worker"]
        current = int(self.contributor_points.get(worker, u256(0)))
        self.contributor_points[worker] = u256(current + score)

        sub_data["status"] = "evaluated"
        self.submission_storage[sub_id] = json.dumps(sub_data, sort_keys=True)
        return result_json

    @gl.public.view
    def get_task(self, task_id: str) -> str:
        if task_id not in self.task_storage:
            return json.dumps(None)
        return self.task_storage[task_id]

    @gl.public.view
    def get_submission(self, sub_id: str) -> str:
        if sub_id not in self.submission_storage:
            return json.dumps(None)
        return self.submission_storage[sub_id]

    @gl.public.view
    def get_score(self, sub_id: str) -> u256:
        if sub_id not in self.score_storage:
            return u256(0)
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
