---
description: Run the pipeline commander — read state, decide, dispatch the owning role sub-agent, run the gate, and advance the stage. Full-auto until a hard stop.
argument-hint: "[--step one action | --dry plan only | <stage> resume at a stage]"
---

Drive the project forward, deciding on the student's behalf but stopping at anything
that must not be invented. This command is the main-thread form of the `commander`
agent (`.claude/agents/commander.md`); dispatch the role sub-agents with the Agent
tool (`subagent_type` = the role name).

## Before starting

Read `project/project.yml`. If it does not exist, tell the user to run `/kickoff`
first, and stop. Then read `project/REGISTER.md` and the relevant files under
`project/` — never work from memory of the conversation. A gate reads the actual
files; so do you.

## Modes

| Invocation | Behaviour |
|---|---|
| `/next` | **Full-auto** — run the loop until a hard stop (Class B) or a gate that needs a human |
| `/next --step` | Run exactly one action (produce one deliverable **or** run one gate), then stop and report |
| `/next --dry` | **Plan only** — say what you would do and where you would stop; change nothing |
| `/next <stage>` | Resume at `<stage>` (still gated; never skip a failed gate) |

## The loop

1. Identify the current `stage`, its gate, and the owning sub-agent (table below).
2. Scan what blocks this stage; classify each unknown by the decision policy.
3. **Class B blocks** → STOP. Summarise what is needed and from whom, ask the user
   up to five questions in one message, and end the run.
4. **Class A open** → decide it, label it `[commander]`, record it under
   `assumptions` (or the document's decision log), and continue.
5. **Deliverable missing (Class C)** → dispatch the owning sub-agent to produce it.
   Documents go through `/doc-new` + the `document-control` sub-agent so the
   register is written in the same edit.
6. Run `/gate <stage>`:
   - **PASS** → it advances `stage:`; loop into the next stage.
   - **NOT YET** → if the gap is Class A/C, fix it and re-gate; if Class B, STOP and ask.
7. Repeat until a hard stop, a failed gate needing a human, or `release` is reached.

In `--step` mode, do exactly one of {produce a deliverable, run a gate} and stop.
In `--dry` mode, walk the same reasoning but make no edits, no dispatch, no gate
writes — output the plan and the first stop only.

## Decision policy — three classes

- **Class A · decide-and-log** — design choices, defaults, estimates, ordering.
  Decide, label `[commander]`, log so it can be overruled.
- **Class B · hard stop** — facts only a person or an external source holds: owner
  name, ToS / legal (O1), a really-measured baseline, sign-off / approval,
  production secrets, an empty `build.definition_of_done`. **Never invent these** —
  stop and ask.
- **Class C · gate evidence** — the deliverable a gate must see. Produce it for real
  via the owning sub-agent; never fake it.

## Stage → sub-agent → gate

| stage | sub-agent (`subagent_type`) | gate |
|---|---|---|
| intake | `project-intake` | G1 |
| product | `product-owner` | G1 |
| analysis | `system-analyst` | G2 |
| design | `design-systems-architecture` | G3 |
| build | `developer` | G4 |
| review | `code-reviewer` | G5 |
| quality | `quality-assurance` | G6 |
| release | `devops-release` | — (pipeline complete) |

The `document-control` sub-agent is invoked alongside any create/revise so the
register and revision history move in the same edit.

## Guardrails (never violate)

1. Advance `stage:` only through `/gate`, only on a real pass; never delete a failed
   gate's history.
2. One role at a time — dispatch a single sub-agent per cycle; do not collapse roles.
3. On contradicting documents, open `/cr` and stop; do not edit the source silently.
4. Every Class A decision is recorded and reversible.
5. A sub-agent cannot ask the user directly; when it returns a Class B need, surface
   it here and ask.

## Report (every cycle)

```
## /next · <stage> → <action>
State: stage=X · last gate=Y · N open questions
Did: <produced / gated what>
Decided (Class A): <items, each labelled [commander]>
▶ STOP (Class B): <if stopped — what is needed, from whom>
Next: <next stage/gate, or the questions asked>
```

Arguments: `$ARGUMENTS`
