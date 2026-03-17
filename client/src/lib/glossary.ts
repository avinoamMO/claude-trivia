// Glossary of technical terms with definitions.
// Terms are matched case-insensitively in question/explanation text.
// Longer terms are matched first to avoid partial matches.

const glossary: Record<string, string> = {
  // Pipeline & Workflow
  "Plan-Spec-Execute-Compound": "The 4-phase pipeline for complex tasks. Plan (discuss architecture), Spec (write code-level blueprint), Execute (agents implement mechanically), Compound (capture lessons learned).",
  "4-phase pipeline": "Plan → Spec → Execute → Compound. A structured workflow where each phase has a gate requiring approval before proceeding.",
  "four-phase pipeline": "Plan → Spec → Execute → Compound. A structured workflow where each phase has a gate requiring approval before proceeding.",
  "Compound phase": "The mandatory retrospective after every completed task. Captures what was learned, what to encode in docs, and what to automate.",
  "Spec phase": "The code-level blueprint phase. Specs define exact file changes, context anchors, and testable acceptance criteria — specific enough that agents make zero decisions.",
  "Plan phase": "The first phase: a conversation with the user to discuss architecture, ask clarifying questions, and propose an approach with tradeoffs.",
  "Execute phase": "The phase where agents follow the spec mechanically, making zero decisions. If something is ambiguous, they stop and report.",

  // Agentic Concepts
  "agentic loop": "The observe-think-act cycle that Claude Code repeats: observe (read tools), think (reason about next step), act (write/execute), repeat until task complete.",
  "agentic loops": "The observe-think-act cycle that Claude Code repeats: observe (read tools), think (reason about next step), act (write/execute), repeat until task complete.",
  "observe-think-act": "The three phases of an agentic loop: Observe gathers information (tool results), Think reasons about what to do, Act executes a tool call or responds.",
  "multi-agent orchestration": "Coordinating multiple agents: parent-child relationships, message passing, parallel execution via waves, and dependency management.",
  "wave execution": "Running independent tasks in parallel as 'waves.' Tasks in the same wave can't modify the same file. After each wave, verify tests pass before starting the next.",
  "no-decisions constraint": "Execution agents follow the spec exactly and never guess. If something is ambiguous, they stop and report rather than making assumptions.",
  "subagent": "A specialized child agent spawned to handle a specific task. Each subagent has its own context and tool access determined by subagent_type.",
  "subagent_type": "Controls what tools a spawned agent can access. 'Explore' = read-only, 'Plan' = no edits, 'general-purpose' = full access.",
  "session handoff": "A structured template written at session end so the next session can resume quickly. Includes status, current task, files modified, next steps, and blockers.",
  "context window": "The maximum amount of text Claude can process in one conversation. Older messages get automatically compressed as you approach the limit.",
  "context compression": "Automatic summarization of older messages when approaching context window limits. Critical information should be written to files before it gets compressed away.",
  "worktree isolation": "Running an agent in a temporary git worktree — an isolated copy of the repo. Changes are kept separate and the worktree is cleaned up if no changes are made.",

  // Tools & MCP
  "MCP": "Model Context Protocol — a standard for connecting Claude to external tool providers. MCP servers expose tools via stdio or SSE transport protocols.",
  "Model Context Protocol": "A standard protocol for connecting AI models to external tool providers. MCP servers expose tools that Claude can discover and use.",
  "tool_choice": "API parameter controlling tool selection: 'auto' (Claude decides), 'any' (must use a tool), or a specific tool name (forced). Too many tools degrades performance.",
  "built-in tools": "Claude Code's native tools: Read, Write, Edit, Glob, Grep, Bash, Agent, WebSearch, WebFetch. Preferred over Bash equivalents for better UX.",
  "structured error responses": "Tools reporting errors as structured objects (error code, message, recovery hints) rather than thrown exceptions. Helps Claude understand what went wrong and how to fix it.",

  // Configuration
  "CLAUDE.md": "Instruction files loaded automatically every session. Three levels: global (~/.claude/CLAUDE.md), project root, and subdirectories. Should be a map, not an encyclopedia.",
  "slash commands": "Custom commands created via .claude/commands/ directory. Markdown files that define reusable prompts, invoked with /command-name.",
  "plan mode": "A mode where Claude proposes changes and waits for approval before implementing. Activated via EnterPlanMode. Appropriate for complex multi-step tasks.",
  "hooks": "Shell commands that execute in response to Claude Code events. PreToolUse fires before a tool executes, PostToolUse after. Used for blocking, logging, or automation.",
  "PreToolUse": "A hook that fires before any tool (Bash, Edit, Read, etc.) executes. Can be used to block dangerous commands, log usage, or trigger side effects.",
  "PostToolUse": "A hook that fires after a tool completes execution. Useful for logging results, triggering notifications, or post-processing output.",
  "CI/CD integration": "Using Claude Code in automated pipelines via headless mode (-p flag). Requires --dangerously-skip-permissions for non-interactive execution.",

  // Prompt Engineering
  "few-shot prompting": "Providing 2-3 examples in a prompt to guide Claude's output format and reasoning. More effective than zero-shot for specific formats, but too many examples can over-constrain.",
  "zero-shot": "Prompting without any examples — relying on instructions alone. Works well for common tasks but less reliable for specific output formats.",
  "tool_use": "Using tool definitions to force structured JSON output from Claude. The tool schema acts as both a constraint and an implicit prompt for the response format.",
  "validation-retry loop": "A prompt pattern: generate output → validate against criteria → if invalid, fix and re-validate. Each iteration should improve, not repeat the same mistake.",
  "extended thinking": "Claude's ability to reason through complex problems step-by-step before responding. Useful for batch processing and multi-step analysis.",
  "multi-instance review": "Using multiple Claude instances to review each other's work independently. Disagreements between reviewers surface real issues. See: /review-parallel pattern.",

  // Methodology
  "spec granularity test": "Can an agent complete this task without making any decisions? If not, the spec needs to be broken down further.",
  "file manifest": "A list in each spec of files to CREATE, MODIFY, or DELETE. Post-execution, compare actual changes against the manifest to catch scope drift.",
  "acceptance criteria": "Testable conditions that must be true when a task is done. Must be verifiable by running a command — no vague 'works correctly' allowed.",
  "context anchors": "Code patterns near a target location used in specs instead of line numbers (which shift as code changes). E.g., 'after the line containing import { Settings }'.",
  "3-Strike Error Protocol": "Strike 1: diagnose and fix. Strike 2: try a DIFFERENT approach. Strike 3: broader rethink and question assumptions. After 3: escalate to user.",
  "5-Question Reboot Test": "When context feels stale, verify: Where am I? Where am I going? What's the goal? What have I learned? What have I done? If any answer is unclear, re-read task files.",
  "progressive disclosure": "A pattern where agents start with minimal stable instructions (CLAUDE.md) and learn where to find deeper context as they navigate the codebase.",
  "garbage collection": "Regular scanning for: deviations from coding standards, stale docs, quality gaps. Fix with small targeted PRs rather than letting bad patterns accumulate.",
  "information provenance": "Tracking where information comes from. The 'everything in-repo' rule: if it's not in a versioned file, it doesn't exist to agents.",
  "escalation": "Knowing when to stop and ask the user vs making a judgment call. Low-risk ambiguity: make assumption and flag it. High-risk: stop and ask.",
  "error propagation": "How errors cascade through multi-agent systems. One agent's incorrect assumption becomes the next agent's trusted input, compounding the problem.",
  "half-migrated pipeline": "An anti-pattern where client-side logic is removed before the server-side replacement is fully implemented, causing silent failures.",
};

// Sort by length descending so longer terms match first (e.g., "Plan-Spec-Execute-Compound" before "Spec")
export const glossaryEntries = Object.entries(glossary)
  .sort((a, b) => b[0].length - a[0].length);

export default glossary;
