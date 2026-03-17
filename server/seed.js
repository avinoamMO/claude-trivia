require("dotenv").config();
const mongoose = require("mongoose");
const Question = require("./models/Question");

const questions = [
  {
    category: "Agents",
    difficulty: 2,
    question: "What does the subagent_type parameter control when spawning agents in Claude Code?",
    explanation: "Claude Code can spawn specialized sub-agents to handle complex tasks. Each agent type has different capabilities and tool access, making the subagent_type parameter crucial for getting the right behavior.",
    options: ["Which AI model to use", "Which tools the agent can access", "The context window size", "The output format"],
    correctIndex: 1,
    deeperKnowledge: "There are several subagent types: 'Explore' gives read-only access (Glob, Grep, Read), 'Plan' allows planning but no edits, and 'general-purpose' has full tool access. Choosing the right type prevents accidental file modifications during research tasks.",
    wrongExplanations: {
      0: "The model is controlled by the 'model' parameter (sonnet, opus, haiku), not subagent_type. subagent_type determines the agent's tool access and role.",
      1: "",
      2: "Context window size is determined by the model, not the subagent_type. All agent types share the same context limits.",
      3: "Output format isn't configurable via subagent_type. The agent returns its results as a message regardless of type."
    }
  },
  {
    category: "Agents",
    difficulty: 3,
    question: "What is the 'no-decisions constraint' in the Claude Code spec-driven workflow?",
    explanation: "When working with multiple agents on complex tasks, a key principle governs how execution agents should behave. This constraint is fundamental to preventing drift between plans and implementation.",
    options: ["Agents must ask the user before every action", "Agents follow the spec exactly and never guess", "Only one agent can run at a time", "Agents cannot create new files"],
    correctIndex: 1,
    deeperKnowledge: "The no-decisions constraint means execution agents should make ZERO decisions. If the spec is ambiguous, they stop and report rather than guessing. This prevents subtle drift where each agent's 'reasonable assumption' compounds into something nobody planned for.",
    wrongExplanations: {
      0: "Asking before every action would make agents unusably slow. The constraint is about following the spec exactly, not about asking permission for each step.",
      1: "",
      2: "Claude Code can run multiple agents in parallel (wave execution). The constraint is about decision-making, not concurrency.",
      3: "Agents can create files if the spec says to. The constraint is about not making decisions beyond what the spec specifies."
    }
  },
  {
    category: "Hooks",
    difficulty: 2,
    question: "When does a PreToolUse hook fire in Claude Code?",
    explanation: "Claude Code supports hooks — shell commands that execute in response to events. Understanding when each hook type fires is essential for building automation workflows.",
    options: ["When the user sends a message", "Before any tool executes", "After the conversation ends", "When Claude starts thinking"],
    correctIndex: 1,
    deeperKnowledge: "PreToolUse fires before each tool call (Bash, Edit, Read, Write, etc). You can use it to: block dangerous commands, log tool usage, trigger external systems, or even build features like the quiz system in WezTerm's status bar. PostToolUse fires after the tool completes.",
    wrongExplanations: {
      0: "User messages trigger different events. PreToolUse specifically fires before Claude executes a tool like Bash, Edit, or Read.",
      1: "",
      2: "There's no 'conversation end' hook in the current hook system. PreToolUse fires before each individual tool execution.",
      3: "Claude's thinking phase doesn't trigger hooks. Hooks are tied to tool executions (Bash, Edit, Read, etc), not the reasoning process."
    }
  },
  {
    category: "Configuration",
    difficulty: 1,
    question: "Why should you use CLAUDE.md files instead of inline prompts for recurring instructions?",
    explanation: "Claude Code offers multiple ways to provide instructions. Understanding the persistence model helps you build more effective workflows that don't require repeating yourself.",
    options: ["They execute faster", "They persist across sessions automatically", "They have better syntax highlighting", "They're required by the API"],
    correctIndex: 1,
    deeperKnowledge: "CLAUDE.md files are loaded automatically at the start of every conversation. They exist at three levels: global (~/.claude/CLAUDE.md), project root (CLAUDE.md), and subdirectories. This creates a progressive disclosure system where agents start with stable instructions and learn more as they navigate deeper into the codebase.",
    wrongExplanations: {
      0: "CLAUDE.md files don't affect execution speed. Their advantage is persistence — they're automatically loaded every session without you having to re-type instructions.",
      1: "",
      2: "CLAUDE.md files are plain markdown with no special syntax highlighting. Their value is in automatic loading and session persistence.",
      3: "CLAUDE.md files are optional, not required. But they're the recommended way to encode project-specific instructions that should persist across conversations."
    }
  },
  {
    category: "Configuration",
    difficulty: 3,
    question: "What is the recommended role of CLAUDE.md according to the 'Harness Engineering' methodology?",
    explanation: "The Harness Engineering approach from OpenAI's research provides specific guidance on how instruction files should be structured for AI-assisted development.",
    options: ["A comprehensive encyclopedia of all project knowledge", "A map with pointers to deeper sources of truth", "A list of all files in the codebase", "A changelog of recent decisions"],
    correctIndex: 1,
    deeperKnowledge: "CLAUDE.md should be a map, not an encyclopedia. A giant instruction file crowds out the task, the code, and relevant docs. When everything is 'important,' nothing is. Use it as a table of contents pointing to lessons files, task plans, and design docs. Progressive disclosure: agents start small and learn where to look next.",
    wrongExplanations: {
      0: "Making CLAUDE.md an encyclopedia is the anti-pattern. Large instruction files crowd out the actual task context. Keep it focused with pointers to deeper docs.",
      1: "",
      2: "File listings belong in project indexes or glob patterns, not CLAUDE.md. The file should contain behavioral instructions and pointers to knowledge sources.",
      3: "Changelogs belong in git history or CHANGELOG.md. CLAUDE.md should encode stable patterns and point to where detailed context lives."
    }
  },
  {
    category: "Methodology",
    difficulty: 2,
    question: "In the four-phase pipeline, what is the correct order of phases?",
    explanation: "Claude Code's recommended workflow for complex tasks follows a structured pipeline. Each phase has a specific purpose and a gate that must be passed before proceeding.",
    options: ["Spec → Plan → Execute → Review", "Plan → Execute → Test → Deploy", "Plan → Spec → Execute → Compound", "Design → Build → Test → Ship"],
    correctIndex: 2,
    deeperKnowledge: "Plan (conversation with user) → Spec (code-level blueprint, reviewed like a PR) → Execute (agents follow spec mechanically) → Compound (mandatory retrospective: what was learned, what to encode, what to automate). The Compound phase is what separates 'task done' from 'system improved.'",
    wrongExplanations: {
      0: "Close, but the Spec phase comes AFTER the Plan phase, not before. Plan is a conversation; Spec is the code-level blueprint that results from it.",
      1: "This misses the Spec and Compound phases. The Spec phase (between Plan and Execute) is critical — it's where tasks become specific enough that agents make zero decisions.",
      2: "",
      3: "This is a generic software lifecycle, not the Claude Code pipeline. The key innovation is the Compound phase — mandatory retrospective after every completed task."
    }
  },
  {
    category: "Methodology",
    difficulty: 4,
    question: "What should happen if a task spec is ambiguous during the Execute phase?",
    explanation: "During execution, agents may encounter situations where the specification doesn't clearly define what to do. The methodology has a specific protocol for handling this.",
    options: ["Make a reasonable assumption and continue", "Skip the ambiguous part", "Stop and report — never guess", "Ask the user in a chat message"],
    correctIndex: 2,
    deeperKnowledge: "This is the no-decisions constraint in action. Execution agents should STOP and report ambiguity rather than guessing. Even 'reasonable assumptions' compound: if 3 agents each make one small guess, the final result can diverge significantly from intent. The fix is better specs, not smarter guessing.",
    wrongExplanations: {
      0: "Making assumptions during execution is exactly what the no-decisions constraint prevents. Even reasonable assumptions compound across multiple agents into unplanned outcomes.",
      1: "Skipping parts of a spec means the task is incomplete. The correct action is to stop and report, so the spec can be clarified before continuing.",
      2: "",
      3: "While user communication is important, the protocol is specifically to stop execution and report back to the orchestrator, not to independently reach out via chat."
    }
  },
  {
    category: "Tools",
    difficulty: 1,
    question: "Which tool should you use to search for file content in Claude Code instead of running grep?",
    explanation: "Claude Code provides dedicated tools that are optimized for common operations. Using the right tool improves the user experience and makes it easier to review what Claude is doing.",
    options: ["Bash with grep command", "The Grep tool", "The Read tool", "The Glob tool"],
    correctIndex: 1,
    deeperKnowledge: "The Grep tool is built on ripgrep and supports regex, file type filtering, context lines, and multiple output modes. It's preferred over Bash grep because: (1) it has correct permissions/access, (2) the user can easily review what was searched, and (3) it provides structured output. Similarly, use Glob instead of find, Read instead of cat, and Edit instead of sed.",
    wrongExplanations: {
      0: "Running grep via Bash works but is not recommended. The dedicated Grep tool provides a better user experience, correct permissions, and structured output.",
      1: "",
      2: "The Read tool reads entire files or specific line ranges. For searching content across files, use the Grep tool instead.",
      3: "The Glob tool finds files by name pattern (like find), not by content. For searching content inside files, use the Grep tool."
    }
  },
  {
    category: "Tools",
    difficulty: 2,
    question: "When should you use the Agent tool with subagent_type 'Explore' vs calling Grep directly?",
    explanation: "Claude Code offers both direct search tools and agent-based exploration. Knowing when to use each approach saves time and context window space.",
    options: ["Always use Explore for any search", "Use Grep for simple searches, Explore for deep research needing 3+ queries", "Explore is faster than Grep", "They do the same thing"],
    correctIndex: 1,
    deeperKnowledge: "Direct Grep/Glob calls are faster for targeted searches ('find class UserService'). Explore agents are better for open-ended research that requires multiple rounds of searching, reading, and cross-referencing. The tradeoff: Explore protects your main context from excessive results but costs more tokens and is slower.",
    wrongExplanations: {
      0: "Using Explore for simple searches wastes tokens and time. For targeted searches like finding a specific function or file, Grep and Glob are much faster.",
      1: "",
      2: "Explore agents are actually slower than direct Grep calls because they spawn a sub-process. Their advantage is thoroughness, not speed.",
      3: "They serve different purposes. Grep searches file content directly; Explore agents can do multiple searches, read files, and synthesize findings across the codebase."
    }
  },
  {
    category: "Agents",
    difficulty: 3,
    question: "Why should execution agents receive the full spec content inline rather than a file reference?",
    explanation: "When delegating tasks to sub-agents, how you pass the specification matters. The methodology has a specific recommendation about this.",
    options: ["File references are slower to read", "Inline specs use less tokens", "Agents might read the wrong file or misinterpret which task is theirs", "It's a style preference with no real impact"],
    correctIndex: 2,
    deeperKnowledge: "Telling an agent to 'read the spec file and find your task' introduces a failure mode: the agent might read the wrong section, misidentify its task, or waste tokens parsing irrelevant specs. Passing the full task content inline eliminates this ambiguity — the agent gets exactly what it needs with zero decisions required.",
    wrongExplanations: {
      0: "File read speed isn't the concern. The issue is accuracy — an agent navigating a spec file might grab the wrong task or misinterpret scope boundaries.",
      1: "Inline specs typically use MORE tokens since you're duplicating content. The benefit is reliability, not token efficiency.",
      2: "",
      3: "It has real impact. In practice, agents given file references frequently misidentify their task scope, leading to overlapping work or missed requirements."
    }
  }
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  await Question.deleteMany({});
  console.log("Cleared existing questions");

  const result = await Question.insertMany(questions);
  console.log(`Seeded ${result.length} questions across categories:`);

  const categories = [...new Set(questions.map(q => q.category))];
  for (const cat of categories) {
    const count = questions.filter(q => q.category === cat).length;
    console.log(`  ${cat}: ${count} questions`);
  }

  await mongoose.disconnect();
  console.log("Done!");
}

seed().catch(console.error);
