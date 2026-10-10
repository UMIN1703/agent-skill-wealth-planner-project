---
description: Open the command center — render the 11-desk board and drive every role full-auto from the current stage to release, stopping only at a hard stop (Class B) or a gate that needs a human.
argument-hint: "[--auto full run (default) | --step one desk | --dry plan only | --board status only | <stage> resume at a stage]"
---

Command the whole floor. This is the main-thread form of the `command-center` agent
(`.claude/agents/command-center.md`) — the commander's full-roster form. Dispatch the
role desks with the Agent tool (`subagent_type` = the role name). Decide on the
student's behalf, but stop at anything that must not be invented.

## Before starting

Read `project/project.yml`. If it does not exist, tell the user to run `/kickoff`
first, and stop. Then read `project/REGISTER.md` and the relevant files under
`project/` — never work from memory. A gate reads the actual files; so do you.

## Modes

| Invocation | Behaviour |
|---|---|
| `/command-center` | **Full-auto** — render the board, then run the loop until a hard stop or a gate that needs a human |
| `/command-center --step` | Run exactly one action (one deliverable **or** one gate), render the board, stop |
| `/command-center --dry` | **Plan only** — show the board and say what you would do and where you would stop; change nothing |
| `/command-center --board` | Render the board and outstanding items only; dispatch nothing, change nothing |
| `/command-center <stage>` | Resume at `<stage>` (still gated; never skip a failed gate) |

## The eleven desks (dispatch one per cycle)

| Desk | `subagent_type` | Stage → gate |
|---|---|---|
| 🧭 project-intake | `project-intake` | intake → G1 |
| 🧭 product-owner | `product-owner` | product → G1 |
| ⏱ project-manager | `project-manager` | cross-cutting — planning/schedule, on demand |
| 🔗 system-analyst | `system-analyst` | analysis → G2 |
| ✏️ design-systems-architecture | `design-systems-architecture` | design → G3 |
| `</>` developer | `developer` | build → G4 |
| 🛡 code-reviewer | `code-reviewer` | review → G5 |
| 🐛 quality-assurance | `quality-assurance` | quality → G6 |
| 🗄 devops-release | `devops-release` | release — final |
| 📄 document-control | `document-control` | cross-cutting — every doc create/revise |

`project-manager` and `document-control` are not stages. Call `document-control` alongside
any `/doc-new` or revision so the register moves in the same edit; call `project-manager`
when a stage needs planning/replanning. Then return to the linear line.

## The loop

1. Render the **command board** (below) from the real state.
2. Identify the current `stage`, its gate, and the owning desk.
3. Scan what blocks this stage; classify each unknown by the decision policy.
4. **Class B** → STOP. Summarise what is needed and from whom, ask ≤5 questions in one
   message, end the run.
5. **Class A open** → decide, label `[command-center]`, record under `assumptions` (or the
   document's decision log), continue.
6. **Deliverable missing (Class C)** → dispatch the owning desk to produce it. Documents go
   through `/doc-new` + the `document-control` desk.
7. **Run the gate through its owning role** (see Gate execution below):
   - **PASS** → the role approves; `/gate` advances `stage:`; loop into the next stage.
   - **NOT YET** → Class A/C gap: fix and re-gate. Class B gap: STOP and ask.
8. Repeat until a hard stop, a failed gate needing a human, or `release` is reached.

## Gate execution (standing working condition)

**Every gate is executed by its owning role, not rubber-stamped by the command-center.**
Dispatch the role that owns the gate to open the real files, verify its deliverable against
the gate's actual criteria, and — when the evidence is genuinely there — **approve and hand
off to the next gate, full-auto.** When merely *unsure*, the role investigates and decides
for itself (Class A: decide-and-log, overridable) instead of bouncing routine uncertainty
back to the user.

Gate → owning role: G1 `product-owner` (with `project-intake`) · G2 `system-analyst` ·
G3 `design-systems-architecture` · G4 `developer` · G5 `code-reviewer` · G6 `quality-assurance`.

**The one limit — "approve when unsure" means look harder and decide (Class A); it never
means invent a Class B fact or approve with the evidence absent.** A legal disclaimer
(ก.ล.ต./BR-07), a ToS/O1 clearance, real credentials/secrets, a measured baseline, a
sign-off, or a rollback that was never rehearsed cannot be verified into existence — there
the role still stops and asks. In a finance app, approving a fabricated pass is real-world
harm, not caution. This keeps the repo rule intact: *a gate that always passes is not a gate.*

In `--step`, do exactly one of {produce a deliverable, run a gate} and stop.
In `--dry`/`--board`, make no edits, no dispatch, no gate writes.

## Decision policy — three classes

- **Class A · decide-and-log** — design choices, defaults, estimates, ordering. Decide,
  label `[command-center]`, log so it can be overruled.
- **Class B · hard stop** — facts only a person or external source holds: owner name,
  ToS/legal (O1), a really-measured baseline, sign-off/approval, production secrets, an
  empty `build.definition_of_done`. **Never invent** — stop and ask.
- **Class C · gate evidence** — the deliverable a gate must see. Produce it for real via
  the owning desk; never fake it.

## Guardrails (never violate)

1. Advance `stage:` only through `/gate`, only on a real pass; never delete a failed gate's history.
2. One desk per cycle — never dispatch two roles at once, never collapse roles. Full-auto
   loops without pausing between stages; it does not run desks in parallel.
3. On contradicting source documents, open `/cr` and STOP; do not edit the source silently.
4. Every Class A decision is recorded and reversible.
5. A desk cannot ask the user directly; when it returns a Class B need, surface it here and ask.

## The command board (render every cycle)

Mark each desk: `✓` done · `▶` active this cycle · `·` idle/waiting · `⟳` on-call · `▲` STOP.

```
╔══════════════ <name> · COMMAND CENTER ══════════════╗
 stage: <stage>   ·   <G1..G6 marks>   ·   <N> open Q
──────────────────────────────────────────────────────
 ▼▼ command-center        orchestrating
 <mark> project-intake    <state>
 <mark> product-owner     <state>
 <mark> project-manager   <state, on-call>
 <mark> system-analyst    <state>
 <mark> design-sys-arch   <state>
 <mark> developer         <state>
 <mark> code-reviewer     <state>
 <mark> quality-assurance <state>
 <mark> devops-release    <state>
 ⟳ document-control       <state, on-call>
╚══════════════════════════════════════════════════════╝
```

## Report (every cycle, under the board)

```
## /command-center · <stage> → <action>
Dispatched: <desk> — <what it produced or gated>
Decided (Class A): <items, each labelled [command-center]>
Gate: <id> <PASS → advanced to <next> | NOT YET → what is missing>
▶ STOP (Class B): <if stopped — what is needed, from whom, the questions asked>
Next: <next stage/gate, or "awaiting answers">
```

Arguments: `$ARGUMENTS`
