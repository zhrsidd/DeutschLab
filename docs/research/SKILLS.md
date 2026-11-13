# Teaching skills installed for DeutschLab

Three upstream instruction-only skills are installed project-locally for Codex in .agents/skills and Claude Code in .claude/skills. These assist developers/content authors; they are not runtime app features. A new agent session may be needed for automatic discovery. This session inspected the files directly; automatic invocation by either client has not been tested.

| Skill | Use in DeutschLab | Example request |
|---|---|---|
| formative-assessment-loop-designer | Specify what each observed response changes in instruction | “Design a loop for Week 3 masculine accusative; offline closed-item grading, advisory evidence only.” |
| spaced-practice-scheduler | Plan cumulative retrieval across modules | “Plan Weeks 1–4 retrieval within the current time budget; retain reviewScheduler.ts intervals.” |
| cognitive-load-analyser | Audit explanations, simultaneous demands and scaffold fading | “Audit the possessions module for an A0/A1 learner with familiar vocabulary.” |

Use the repo's actual learner profile rather than the skills' default classroom assumptions. Require relevant CURRICULUM.md sections, taught vocabulary and objective as inputs. Keep product constraints in CLAUDE.md authoritative: do not change SRS intervals, mastery, progression or AI authority merely because a skill proposes it. Treat skill effect-size claims as leads for checking sources, not expected DeutschLab gains.

## Provenance and licensing

Author: Gareth Manning. Source: https://github.com/GarethManning/education-agent-skills
Pinned revision: 135d6275e7db0657d70b147f46d3191c5430677d.
Unmodified copies, including LICENSE, installed 13 November 2026.
Licence: CC BY-SA 4.0, https://creativecommons.org/licenses/by-sa/4.0/.
See [skills-lock.json](skills-lock.json) for upstream paths and SHA-256 hashes.

Preserve attribution and ShareAlike obligations when redistributing or adapting these skills. Their licence is attached to the upstream materials; this installation does not assert a licence change for DeutschLab product code. Keep future skill adaptations clearly separate and labelled.

## Selection and review

Web discovery also found learning-science-guide (wentorai/research-plugins), instructional-prompt-engineering (scibly-dev/skills), and K12 lesson authoring (learning-commons-org/agent-skills). These were not installed: the selected set more directly covers this task without a broad classroom toolkit. Discovery listings are not endorsements; the alternatives were not fully audited.

Reviewed selected SKILL.md contents and directory inventories before copying. Selected directories contain Markdown only, no executables or hooks. No installer or upstream script was executed. General educational skills were preferred over assuming that a German prose-writing skill is a German-teaching specialist.

The formative-loop skill makes broad effect-size/inner-loop claims that should not be transplanted into a product promise. The cognitive-load skill's numeric “element counts” are design prompts, not measurements of this learner's mental capacity. The spacing skill explicitly labels its exact timetable as heuristic. The report uses the skills' design questions while retaining these limitations.

## Maintenance

1. Review upstream changes at a chosen revision; never auto-update from a moving branch.
2. Compare all files, scope, licence and instructions before copying.
3. Update both client copies together, then refresh the manifest hashes/revision.
4. Verify copied files match upstream and that no unrelated dependencies or scripts were added.
