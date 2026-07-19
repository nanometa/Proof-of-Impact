import json


GEN = 10**18
BOUNTY = GEN // 10
START_TIMESTAMP = 1767225600
ONE_HOUR = 3600


def address_value(raw):
    from genlayer.py.types import Address

    return Address(raw)


def address_text(raw):
    return "0x" + bytes(raw).hex()


def deploy_manager(direct_vm, direct_deploy, owner):
    direct_vm.warp("2026-01-01T00:00:00Z")
    direct_vm.sender = owner
    direct_vm.value = 0
    return direct_deploy("contracts/TaskManager.py")


def create_funded_task(direct_vm, manager, creator, bounty=BOUNTY):
    direct_vm.sender = creator
    direct_vm.deal(creator, 10 * GEN)
    direct_vm.value = bounty
    task_id = manager.create_task(
        "Escrow task",
        "Deliver independently verifiable evidence.",
        "The fetched artifact must satisfy the stated requirement.",
        100,
        70,
        ONE_HOUR,
    )
    direct_vm.value = 0
    return task_id


def task_json(manager, task_id):
    return json.loads(manager.get_task(task_id))


def escrow_json(manager, task_id):
    return json.loads(manager.get_task_escrow(task_id))


def test_creation_requires_real_gen_deposit(
    direct_vm,
    direct_deploy,
    direct_alice,
):
    manager = deploy_manager(direct_vm, direct_deploy, direct_alice)
    direct_vm.sender = direct_alice
    direct_vm.value = 0

    with direct_vm.expect_revert("a GEN bounty deposit is required"):
        manager.create_task(
            "No deposit",
            "This task must not be created.",
            "A real GEN escrow is mandatory.",
            100,
            70,
            ONE_HOUR,
        )

    assert int(manager.get_task_count()) == 0


def test_creation_locks_exact_bounty_and_terms(
    direct_vm,
    direct_deploy,
    direct_alice,
):
    manager = deploy_manager(direct_vm, direct_deploy, direct_alice)
    task_id = create_funded_task(direct_vm, manager, direct_alice)

    task = task_json(manager, task_id)
    escrow = escrow_json(manager, task_id)

    assert task_id == "task-0"
    assert task["creator"] == address_text(direct_alice)
    assert task["escrow_total_wei"] == str(BOUNTY)
    assert task["escrow_remaining_wei"] == str(BOUNTY)
    assert task["payout_threshold"] == 70
    assert task["deadline"] == START_TIMESTAMP + ONE_HOUR
    assert task["refund_available_at"] == START_TIMESTAMP + ONE_HOUR + 86400
    assert escrow["status"] == "funded"
    assert escrow["settled"] is False
    stats = json.loads(manager.get_platform_stats())
    assert stats["total_locked_wei"] == str(BOUNTY)


def test_creator_cannot_withdraw_bounty_early(
    direct_vm,
    direct_deploy,
    direct_alice,
):
    manager = deploy_manager(direct_vm, direct_deploy, direct_alice)
    task_id = create_funded_task(direct_vm, manager, direct_alice)
    direct_vm.sender = direct_alice

    with direct_vm.expect_revert("GEN bounty is locked until a winner or task expiry"):
        manager.cancel_task(task_id, "Changed my mind")

    with direct_vm.expect_revert("GEN bounty is locked until a winner or task expiry"):
        manager.close_task(task_id)

    assert escrow_json(manager, task_id)["remaining_wei"] == str(BOUNTY)


def test_only_authorized_proof_contract_can_record_work(
    direct_vm,
    direct_deploy,
    direct_alice,
    direct_bob,
):
    manager = deploy_manager(direct_vm, direct_deploy, direct_alice)
    task_id = create_funded_task(direct_vm, manager, direct_alice)
    direct_vm.sender = direct_bob

    with direct_vm.expect_revert("only authorized submitter"):
        manager.record_submission(
            task_id,
            "sub-0",
            address_text(direct_bob),
            START_TIMESTAMP,
        )


def test_low_score_keeps_escrow_funded(
    direct_vm,
    direct_deploy,
    direct_alice,
    direct_bob,
    direct_charlie,
):
    manager = deploy_manager(direct_vm, direct_deploy, direct_alice)
    task_id = create_funded_task(direct_vm, manager, direct_alice)

    direct_vm.sender = direct_alice
    manager.set_authorized_submitter(address_value(direct_bob))
    direct_vm.sender = direct_bob
    manager.record_submission(
        task_id,
        "sub-0",
        address_text(direct_charlie),
        START_TIMESTAMP,
    )
    manager.record_evaluation(
        task_id,
        "sub-0",
        address_text(direct_charlie),
        69,
        69,
    )

    task = task_json(manager, task_id)
    escrow = escrow_json(manager, task_id)
    assert task["status"] == "open"
    assert escrow["status"] == "funded"
    assert escrow["remaining_wei"] == str(BOUNTY)
    assert escrow["settled"] is False
    assert int(manager.get_task_pending_count(task_id)) == 0
    assert int(manager.get_task_evaluated_count(task_id)) == 1


def test_first_qualifying_score_pays_once(
    direct_vm,
    direct_deploy,
    direct_alice,
    direct_bob,
    direct_charlie,
    direct_owner,
):
    manager = deploy_manager(direct_vm, direct_deploy, direct_alice)
    task_id = create_funded_task(direct_vm, manager, direct_alice)

    direct_vm.sender = direct_alice
    manager.set_authorized_submitter(address_value(direct_bob))
    direct_vm.sender = direct_bob
    manager.record_submission(
        task_id,
        "sub-0",
        address_text(direct_charlie),
        START_TIMESTAMP,
    )
    manager.record_submission(
        task_id,
        "sub-1",
        address_text(direct_owner),
        START_TIMESTAMP + 1,
    )
    manager.record_evaluation(
        task_id,
        "sub-0",
        address_text(direct_charlie),
        90,
        90,
    )
    manager.record_evaluation(
        task_id,
        "sub-1",
        address_text(direct_owner),
        95,
        95,
    )
    manager.record_evaluation(
        task_id,
        "sub-0",
        address_text(direct_charlie),
        90,
        90,
    )

    task = task_json(manager, task_id)
    escrow = escrow_json(manager, task_id)
    stats = json.loads(manager.get_platform_stats())

    assert task["status"] == "closed"
    assert escrow["status"] == "payout_scheduled"
    assert escrow["winner"] == address_text(direct_charlie)
    assert escrow["winning_submission"] == "sub-0"
    assert escrow["remaining_wei"] == "0"
    assert escrow["payout_wei"] == str(BOUNTY)
    assert stats["total_paid_wei"] == str(BOUNTY)
    assert int(manager.get_task_evaluated_count(task_id)) == 2


def test_expiry_refund_waits_for_finalization_grace(
    direct_vm,
    direct_deploy,
    direct_alice,
):
    manager = deploy_manager(direct_vm, direct_deploy, direct_alice)
    task_id = create_funded_task(direct_vm, manager, direct_alice)

    direct_vm.warp("2026-01-02T00:59:00Z")
    with direct_vm.expect_revert("settlement grace period is still active"):
        manager.refund_expired_task(task_id)

    direct_vm.warp("2026-01-02T01:01:00Z")
    manager.refund_expired_task(task_id)

    task = task_json(manager, task_id)
    escrow = escrow_json(manager, task_id)
    assert task["status"] == "expired"
    assert escrow["status"] == "refund_scheduled"
    assert escrow["remaining_wei"] == "0"
    assert escrow["refund_wei"] == str(BOUNTY)


def test_late_or_self_submission_is_rejected(
    direct_vm,
    direct_deploy,
    direct_alice,
    direct_bob,
):
    manager = deploy_manager(direct_vm, direct_deploy, direct_alice)
    task_id = create_funded_task(direct_vm, manager, direct_alice)
    direct_vm.sender = direct_alice
    manager.set_authorized_submitter(address_value(direct_bob))
    direct_vm.sender = direct_bob

    with direct_vm.expect_revert("task creator cannot submit to own task"):
        manager.record_submission(
            task_id,
            "sub-self",
            address_text(direct_alice),
            START_TIMESTAMP,
        )

    with direct_vm.expect_revert("task submission deadline has passed"):
        manager.record_submission(
            task_id,
            "sub-late",
            address_text(direct_bob),
            START_TIMESTAMP + ONE_HOUR + 1,
        )
