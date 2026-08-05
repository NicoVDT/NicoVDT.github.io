# A4 Presentation - word for word

Everything below is what you say out loud. Anything in `[square brackets]` is a
thing you do, not a thing you read.

Roughly 6 minutes 20 at a normal pace. The planning notes are in
`speaking-notes-7min.md` if you want the reasoning behind the structure.

---

## SLIDE 1 - Title and problem (40 sec)

Hi, I'm Nico, and this is Certacito, our A4 prototype for Group 28. There's six
of us on the project.

So, AI agents. They've stopped just answering questions and started actually
doing things. Reading records, sending emails, calling APIs. And the security
controls we've got were all built around a person clicking a button, where
there's someone to hold accountable if it goes wrong.

That leaves a pretty big gap. When an agent does something it shouldn't have,
most organisations can't tell you what it did, why it was allowed, or who
approved it.

Certacito sits in between the agent and the action and answers those three
questions. It's a prototype of a governance layer, not a finished compliance
product, and I'll show you it running at the end.

---

## SLIDE 2 - Architecture (1 min)

This is the architecture. Four layers.

The agent proposes a tool call. A hook intercepts it before anything executes.
That goes to our governance API, which runs three things: a semantic guardrail
looking for prompt injection, a risk classifier, and the policy engine. And
whatever it decides gets written to a hash-chained audit store.

Three outcomes. Permit, deny, or escalate. Escalate isn't a failure, it's the
interesting one. The action pauses in a queue and waits for a human, and we
record which human made the call.

The word I'd like you to take away is fail-closed. If the hook can't reach our
API, the action is denied, not allowed through. That's deliberate. A governance
system that fails open is worse than having nothing, because it quietly produces
a record saying everything was fine.

On the non-functional side, the dashboard updates in under a second over
WebSockets, the audit log is hash-chained, every endpoint has role-based access
control, and we mask personal data before we store it.

---

## SLIDE 3 - Engineering quality (50 sec)

Sixty-three automated tests, CI runs on every push, and the fail-closed cases
are covered explicitly.

But the thing I actually want to tell you about is a bug we found.

Our audit log is meant to be immutable. Chain verification started failing, and
when we dug into it, two requests arriving at the same time could both read the
same end of the chain and both append to it. So our immutable log had forked.

We fixed it by serialising the writes. Then we wrote a repair tool, and before it
touched anything we made it prove it could reproduce the existing hashes exactly,
byte for byte. Once it passed that, it re-linked sixteen thousand seven hundred
entries.

The reason I'm telling you a story about our own bug is that the integrity check
caught us before it had to catch an attacker. That's the check doing its job.

---

## SLIDE 4 - Requirements (40 sec)

Where we're up to. FR-01 through FR-10 are implemented. FR-11 is the integration
with Group 2 and it's blocked on their API contract, not on us.

And we've got two known limitations we're not going to hide. Policy conditions
don't support OR yet. And approval SLA expiry is worked out when you read the
queue rather than by a background worker, so an expiry isn't processed until
someone looks.

Both of those are written up in the traceability matrix. We'd rather tell you
about them than have you find them.

---

## SLIDE 5 - Live demo (2 min 45)

Right, let me show you it actually working.

[switch to the terminal and the dashboard side by side]

The agent on this machine is locked down. It's only allowed to run one command,
our execution gate. Anything else it wants to do has to go through that.

So first, something harmless.

[run: certacito-exec-gate date]

That's permitted, it matched our approved tools rule, and it ran. And if you
watch the dashboard, the decision is already there.

[point at the live feed]

Now something it shouldn't be doing.

[run: certacito-exec-gate ls ~/patient_records]

Blocked. The gate classified that as a data access, nothing in our policy permits
it, so the default deny caught it. And it never ran. That folder was never
touched.

[run: certacito-exec-gate whoami]

Same again, for a different reason. whoami isn't on the approved list, so the
rule doesn't match and it falls through to deny.

[open the audit log, click Verify chain]

Every one of those is in the audit log with its own hash. If I hit verify, it
walks the whole chain from the start and recomputes every hash. That comes back
valid.

And now the part I actually care about.

[try to run whoami directly, without the gate]

I've asked it to skip the gate and just run the command. It can't. The runtime
refuses it before a shell even exists. There's no route to execution that goes
around the governance layer.

That's the whole idea. Governance an agent can opt out of isn't governance.

---

## SLIDE 6 - Conclusion (25 sec)

[back to the slides]

So that's the loop. An action gets proposed, intercepted, checked against policy,
escalated to a person when it matters, and recorded so nobody can quietly rewrite
what happened.

We designed this in A3, and it's built, deployed and running now. The supporting
documents are in the appendix, and the code runs with one command from the repo.

Thanks. Happy to take questions.

---

# If they ask

Short answers, in your own words.

**"What stops the agent going around the governance layer?"**
Nothing at the model level, so we don't try. We enforce it at execution instead.
The agent is only permitted to run one command, the gate, so anything else is
refused before it runs. That's what I showed at the end.

**"Is the audit log really immutable?"**
It's tamper-evident rather than tamper-proof, and that's an important difference.
Someone with database access can still delete a row. What they can't do is delete
it without breaking the chain, and verify catches that.

**"How do you know the policy engine is correct?"**
Unit tests for each rule, and there's a dry-run endpoint so you can test a policy
against a real action before it goes live.

**"What if your governance API goes down?"**
Everything gets denied. It's fail-closed and we test for it.

**"Why not use a blockchain for the audit log?"**
It's a single-writer append-only log, so there's no consensus problem to solve. A
hash chain gives us the tamper-evidence without the overhead.

**"What isn't finished?"**
Group 2 integration, OR support in policy conditions, the background SLA worker,
and a custom domain with TLS.

**"How much did each person do?"**
It's split by accountability area and the full breakdown is in the contribution
table submitted with the code.

Anything else, the detail is in `docs/live-demo-cheatsheet.md`.
