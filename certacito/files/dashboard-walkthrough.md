# Dashboard walkthrough - word for word

No slides. Just you, the browser, and the live system. Roughly 6 minutes, but it
stretches or shrinks easily because each screen is self-contained.

Everything below is what you say. Anything in `[square brackets]` is a thing you
do, not a thing you read.

Use this if the projector setup falls through, if they ask you to "just show us
the system", or as the A4 demo on its own.

---

## Opening (30 sec)

[have the dashboard open and logged in before you start]

So this is Certacito. The short version is that it's a governance layer that
sits between an AI agent and the things that agent is able to do.

Every action an agent wants to take gets intercepted before it runs, checked
against policy rules that live outside the model, and then it's either permitted,
denied, or escalated to a person. And all of it gets written to an audit log that
you can't quietly edit afterwards.

I'll walk through the actual system rather than talk about it in the abstract.

---

## The dashboard (1 min 15)

[you're on the Governance Dashboard]

This is the main view. Everything here is real, it's coming out of the database,
none of it is mocked up.

Across the top are the numbers that matter. Total actions we've intercepted,
how many we blocked, how many were critical risk, and how many are sitting
waiting for a human to approve them.

[point at Blocked Actions]

That blocked number is the one I'd look at first. That's not the system failing,
that's the system doing its job. Every one of those is an action an agent tried
to take and wasn't allowed to.

[point at the Live Activity Feed]

Down the left is the live feed. This updates over a WebSocket, so when a decision
happens it appears here in under a second, we're not polling for it. You can see
the agent ID, the type of action, the risk level, and what we decided.

[point at the risk donut and the 7-day chart]

The donut is the risk spread, and this is decisions over the last week so you can
see whether blocked actions are trending up.

[point at Top Policy Violations]

And this is which rules are firing most. Right now it's mostly data access scope,
which makes sense for the healthcare scenario we've been testing against.

---

## Policy rules (1 min)

[click Policy rules]

This is where the governance actually lives, and it's the bit I'd want you to
take away.

The rules are configuration, not code. Each one has an action type it applies to,
a risk threshold, an outcome, and a condition. Changing a rule doesn't need a
redeploy, it applies to the very next action that comes through.

[point at a rule's regulatory tag]

Each rule also carries what it maps to on the regulatory side, so things like the
Privacy Act or My Health Records. That's what makes the compliance reporting
meaningful rather than just a count.

The important design decision is what happens when nothing matches. If no rule
permits an action, we deny it. We don't let it through and log a warning. We call
that fail-closed, and it's deliberate, because a governance system that fails
open is worse than having none at all. It produces a record saying everything was
fine.

---

## The audit log (1 min 30)

[click through to the audit log]

This is the part I'm most confident about technically.

Every decision, including the ones we permitted, gets written here. There's no
path through the system that skips it.

[expand one entry]

If I open one up, you get the full record. The agent, what it tried to do, which
rule matched, the risk level, and the payload.

[point at the masked payload]

Notice the payload is masked. Names, emails, patient identifiers, all reduced
before we store them. We keep a hash of the original so we can still prove
integrity, but we're not sitting on a pile of personal data.

[point at the hashes]

And each entry carries its own hash plus the hash of the entry before it. They're
chained together.

[click Verify chain]

So if I hit verify, it goes back to the very first entry and recomputes every
hash in order. If anything had been changed, that row's hash wouldn't match its
contents any more, and every row after it would break too.

[wait for the result]

Valid. And I'd rather describe that accurately than oversell it: it's
tamper-evident, not tamper-proof. Someone with database access can absolutely
delete a row. What they can't do is delete it without this check noticing.

---

## Approvals (45 sec)

[click Approval queue]

Not everything is a yes or a no. Some actions are legitimate but risky enough
that a person should decide, and those escalate into this queue instead of just
happening.

Each item shows what was requested and has an SLA countdown on it. If nobody
responds in time it auto-rejects, which is the fail-closed principle again.

[approve or deny an item if there's one in the queue]

And when someone does make a call, we record which user made it, taken from their
login rather than from whatever the request claimed. So the accountability trail
is real.

---

## Reports and access control (45 sec)

[click Reports and compliance]

Compliance reporting comes off the same audit data. You pick a period and it
gives you the decision breakdown and the rule activity, and you can export it as
a PDF. There's also scheduled reports so it can generate on a recurring basis.

[click Settings, then to roles or API keys]

And access control runs across the whole thing. Three roles, administrator,
analyst and viewer, enforced on every endpoint rather than just hidden in the UI.
An analyst genuinely cannot create users, the API refuses it.

Agents authenticate differently, with API keys, because an agent can't do an
interactive login. Keys can be created and revoked here, and revoking one takes
effect immediately.

---

## Closing (30 sec)

So that's the loop, end to end. An agent proposes an action, we intercept it
before it runs, we check it against rules that the agent has no way to argue
with, and a person gets involved when it matters. Then all of it gets recorded in
a way that can be checked afterwards.

The thing I'd emphasise is that none of the enforcement is in the model's prompt.
It's in Python, outside the agent. So you can't talk the system out of a rule,
which is really the whole point of it.

Happy to dig into any part of that.

---

# If they ask

**"Is this actually intercepting a real agent, or just simulated traffic?"**
Both. There's a simulator generating background traffic so the dashboard has
something in it, and there's a real agent on the same machine whose commands go
through the gate. The audit log tells you which is which by agent ID.

**"What happens if the governance API goes down?"**
Everything gets denied. The hook fails closed, so an agent that can't reach us
can't act.

**"Could an agent just bypass the layer?"**
Not at execution. The agent is only permitted to run one command, our gate, so
anything else is refused before it gets to a shell.

**"How do you know a policy change won't break something?"**
There's a dry-run endpoint that evaluates an action against the rules without any
side effects, so you can test a policy before it's live.

**"What's not finished?"**
The Group 2 integration is blocked on their API contract. Policy conditions don't
support OR yet, and SLA expiry is evaluated when the queue is read rather than by
a background worker. All three are written up in the traceability matrix.
