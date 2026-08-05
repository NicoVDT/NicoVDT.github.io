# A4 Prototype Presentation - Speaking Script

Group 28 - Certacito.ai. Sixteen slides, presented solo. The A4 marking sheet does
not score speaker distribution, so one presenter costs nothing.

Timing assumes a 20 minute slot: roughly 12 minutes of slides, 3 minutes of live
demo, 5 minutes of questions. If you are running long, slide 7 and slide 11 are
the two that can be cut to a sentence each without breaking the thread.

These are speaking notes, not a script to read out. Say them in your own words -
a presenter reading verbatim is obvious from the back of the room, and the
markers ask follow-up questions you can only answer if you actually understand
the slide.

---

## Slide 1 - Title (Nico, 20 sec)

Group 28, Certacito.ai, A4 prototype presentation. Name the group, then go
straight to the problem - do not spend time on the title card.

## Slide 2 - The problem (Nico, 90 sec)

The hook: AI agents increasingly take actions on their own - reading records,
sending mail, calling APIs. The controls we have were designed for humans
clicking buttons, and they assume a person is there to be accountable.

Land the gap plainly: **when an agent does something it should not have, most
organisations cannot tell you what it did, why it was allowed, or who approved
it.** Certacito sits between the agent and the action and answers all three.

Do not oversell. This is a prototype of a governance layer, not a finished
compliance product.

## Slide 3 - Method (Nico, 60 sec)

Agile Scrum with UCD, now in delivery rather than discovery. Point at the sprint
structure, then immediately at the evidence - `docs/screenshots/` are screenshots
of actual working software, not a sprint board.

The marking notes specifically ask that agile claims be backed by real work
rather than a plan, so say the word "evidence" and show you have it.

## Slide 4 - Architecture (Nico, 2 min)

Four layers: the agent, the interception hook, the governance API (policy engine,
risk classifier, semantic guard), and the audit store.

The phrase that matters is **fail-closed**. If the hook cannot reach the
governance API, the action is denied, not allowed through. Say why: a governance
system that fails open is worse than none, because it produces a record that says
everything was fine.

Cover the non-functional side here, because the marking notes call for it -
response time under a second on the live dashboard, hash-chained audit for
integrity, RBAC for access control, PII masking in stored payloads.

## Slide 5 - The governance loop (Nico, 2 min)

Walk one action all the way through: proposed, intercepted, classified for risk,
matched against policy, decided, recorded. Note that ESCALATE is a real third
outcome, not a failure mode - it is how a human stays in the loop.

If you only get one technical point across in the whole presentation, make it
this slide.

## Slide 6 - Requirements to date (Nico, 2 min)

Work the table. Be straight about status: FR-01 to FR-10 implemented, FR-11
blocked externally on Group 2's API contract, and two known limitations recorded
against FR-02 and FR-05.

**Do not hide the limitations.** Naming them yourself is worth more than being
caught by a question, and the RTM in the appendix documents both.

## Slide 7 - A3 Figma to A4 product (Nico, 90 sec)

What changed from the design and why. Frame every change as a reason, not a
revision: this moved because users could not find it, this was simplified after
the usability pass, this was added once we had real data flowing.

Cuttable if time is tight.

## Slide 8 - Dashboard (Nico, 60 sec)

Live decisions streaming in. Mention the sub-second update path (WebSocket, not
polling) and the design-system consistency with A3.

## Slide 9 - Audit log (Nico, 90 sec)

Tamper-evident, not just append-only. Each entry hashes the previous one, so
altering an old record breaks every hash after it, and **Verify chain** proves it
end to end. Payloads are masked - show a masked record.

Expect a question about whether the chain has ever actually caught anything. It
has, and that is slide 13, so promise it rather than answering early.

## Slide 10 - Approval queue (Nico, 60 sec)

Humans keep the final call. Show an escalated item, and the approve/deny path
with the reviewer's identity recorded against the decision.

## Slide 11 - Policy rules (Nico, 60 sec)

Governance as configuration, not code. Ten pre-built rules in the library, and
rules can be edited without a redeploy. Cuttable if time is tight.

## Slide 12 - Live demo (Nico, 3 min)

Six steps on the slide. Rehearse this at least twice against the real system
before the day, and have the recording ready.

**Step 6 is the one that earns the marks.** The first five steps show the system
working when the agent cooperates. Step 6 shows what happens when it does not:
ask the agent to run a command directly, bypassing the gate, and it cannot - the
action is refused before it ever reaches a shell. The agent's only route to
execution is through the governance gate.

The line to say out loud: *governance an agent can opt out of is not governance.*

If the live system misbehaves, switch to the recording without apologising for
it. A smooth recording beats a panicked debug session.

## Slide 13 - Engineering quality (Nico, 2 min)

Forty-four automated tests, CI on every push, fail-closed cases covered
explicitly.

Then the two war stories, which are the strongest "knowledge and analysis"
material in the deck:

**The forked audit chain.** Chain verification started failing. Two concurrent
intercepts could both read the same chain head and both append to it, forking an
"immutable" log. Fixed by serialising appends; repaired with a tool that first
proved it could reproduce the stored hashes byte-for-byte before re-linking
16,722 entries. The point: the integrity check caught us before it had to catch
an attacker.

**The clean deploy.** Deploying to a machine that had never seen our code broke
four things the passing test suite had hidden - an unpinned bcrypt that returned
500 on every login, a bug that made the first registered account a Viewer so
nobody could create users, a stray symlink into a developer's filesystem, and
paths hardcoded to one machine. The point: **nothing was reproducible until we
tried to reproduce it**, and a green test suite on one box proves less than
people think.

Both stories are honest about getting something wrong and then fixing it
properly. That reads better to markers than claiming a clean run.

## Slide 14 - Deployment (Nico, 90 sec)

Live on an Azure VM - API and built frontend in one image, PostgreSQL and Redis
alongside, CI green on every push. The governed agent runs on that same VM, so
the demo does not depend on anyone's personal machine.

Be accurate about *why* it moved: the team needed access without handing out
server logins, and access control is the product's own RBAC rather than SSH keys.
Hosting is not a marked criterion, so do not dwell - one slide, then move on.

## Slide 15 - Progress vs plan (Nico, 90 sec)

Every Must-have implemented including the Azure host, Should-haves FR-08/09/10
done, FR-11 externally blocked. Then the remaining-work table with named owners,
and the two live risks with their agreed fallbacks.

## Slide 16 - Conclusion (Nico, 45 sec)

Close on the loop: proposed, intercepted, evaluated, escalated when it matters,
recorded so nobody can rewrite history. Built in A2, designed in A3, demonstrated
today. Point at the appendix documents and hand to questions.

---

## Questions to be ready for

Each of these has come up in similar reviews, and each has a real answer in the
system. All of them come to you, so the cheatsheet in `docs/live-demo-cheatsheet.md`
is the thing to have open.

**"What stops the agent going around the governance layer?"**
Nothing at the model level - so we enforce it at execution. The agent is only
permitted to run one command, the gate, and anything else is denied before it
runs. Demonstrated live at step 6.

**"Is the audit log actually immutable?"**
Append-only and hash-chained, so it is tamper-*evident* rather than tamper-proof.
Anyone with database access can still delete rows, but they cannot do it without
breaking the chain, and Verify chain surfaces that. Say it in those words -
overclaiming here is the easiest way to lose credibility.

**"How do you know the policy engine is right?"**
Unit tests per rule, plus a dry-run endpoint that evaluates an action without
side effects so a policy can be tested before it goes live.

**"What happens if the governance API is down?"**
Everything is denied. Fail-closed, tested.

**"What is not finished?"**
FR-11 (Group 2 integration, blocked on their API contract), the FR-02 condition
parser, the FR-05 background SLA worker, and custom domain + TLS on Azure. All
four are on slide 15 with owners.

**"How much of this did each of you do?"**
Contribution table in the appendix. Make sure it is signed before submission -
it is a marked attachment.

---

## Before the day

- Book the supervisor/client demo. It is the top line of the marking sheet and
  it gates everything else being scored.
- Rehearse the demo twice against the live system, and record the fallback.
- Get the contribution table signed. It is a marked attachment and every Sign
  cell is currently empty.
- Confirm the seeded admin login works on the machine you will present from.
- Check the live countdown or any date-sensitive screenshot has not gone stale.
