# How it works - word for word

About 3 minutes. Use it when someone asks how the system actually works, in the
supervisor demo, or as the technical middle of a longer talk.

Everything below is what you say. `[square brackets]` are things you do.

---

## The idea (25 sec)

The whole thing rests on one assumption, which is that you can't trust an agent to
police itself. If the rules live in the prompt, the agent can be talked out of
them. So we don't put them there.

Instead we put the rules in code, outside the model, and we make sure nothing the
agent does reaches the outside world without going through that code first.

---

## How that's enforced (30 sec)

On this machine the agent is only allowed to run one program. It's our execution
gate. Anything else it tries to run gets refused by the runtime before it even
becomes a process.

So the gate isn't something the agent politely chooses to use. It's the only door
out. That's the bit I'd want you to take away, because everything else depends on
it. If the agent could just run commands directly, none of the rest would matter.

---

## What the gate does (30 sec)

When the agent runs something through the gate, the gate doesn't execute it
straight away. It looks at the command, works out what kind of action it is, so
whether it's a data access or an external call or a plain tool invocation, pulls
out what it's targeting, and sends all of that to our API.

Then it waits. If the answer comes back permit, it runs the command. Anything
else, it prints the refusal and stops. The command never executes.

---

## What the API does (1 min)

Four things happen, in this order.

First the semantic guardrail. That's pattern matching for prompt injection and
data exfiltration attempts. If that fires, it's an immediate deny and we don't
even get to the policy engine.

Second, the policy engine. It matches on the action type, then checks the rule's
conditions, so things like whether the tool is in our approved list. If several
rules match, the highest risk one wins.

Third, and this is the important one, if nothing matches we deny. We don't allow
it and log a warning. The system's resting state is refusal. We call that
fail-closed, and it also covers the case where the engine throws an error or the
agent can't reach the API at all.

And if the decision is escalate, that's the third outcome. It doesn't run and it
doesn't get refused, it goes into a queue and waits for a person.

Then every decision gets written to the audit log. Permits included. There's no
path through that endpoint that skips the write.

---

## The audit log (40 sec)

Each row is hashed. Not just the row on its own, the hash covers all twelve
columns plus the hash of the row before it. So they're chained together.

That means if you go into the database and change something, that row's hash
stops matching its own contents, and every row after it breaks too, because they
were all chained off the value you just changed. Verify walks the whole chain
from the beginning and recomputes every hash.

I'd describe that accurately rather than oversell it. It's tamper-evident, not
tamper-proof. You can still delete a row. You just can't do it without this
noticing.

---

## Why it matters (20 sec)

The reason any of this works is that the rules aren't in the model's context.
They're in YAML and Python, on the other side of an API call.

So you can't talk the system into permitting something, because the thing making
the decision was never listening to you in the first place.
