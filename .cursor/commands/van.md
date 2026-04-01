# VAN Command - Initialization & Entry Point

This command initializes the Memory Bank system, performs platform detection, determines task complexity, and routes to appropriate workflows.

## CRITICAL: Memory Bank Workflow

**При вызове `/van` агент ДОЛЖЕН следовать этому процессу:**

### Step 1: Verify Memory Bank Structure
```
✓ Check memory-bank/ directory exists
✓ Check memory-bank/tasks.md exists
✓ Check memory-bank/activeContext.md exists
✓ Check memory-bank/progress.md exists
```

### Step 2: Platform Detection
```
✓ Detect OS (macOS/Windows/Linux)
✓ Set path separators
✓ Adapt commands for platform
```

### Step 3: Task Analysis & Complexity Determination
```
✓ Read task description
✓ Analyze scope and requirements
✓ Determine complexity level (1-4)
```

### Step 4: Route Based on Complexity
- **Level 1:** Quick fix → Continue to BUILD
- **Level 2-4:** → MUST switch to PLAN mode

## Memory Bank Files Location

**CRITICAL:** All Memory Bank files are in `memory-bank/` directory:
- `memory-bank/tasks.md` - Source of truth for task tracking
- `memory-bank/activeContext.md` - Current focus and context
- `memory-bank/progress.md` - Implementation status
- `memory-bank/projectbrief.md` - Project foundation
- `memory-bank/systemPatterns.md` - Architecture patterns
- `memory-bank/style-guide.md` - Code style guidelines

## Complexity Levels

### Level 1: Quick Bug Fix
- Single file change
- Obvious fix
- No architectural impact
- **Action:** Proceed directly to BUILD

### Level 2: Simple Enhancement
- 2-5 files affected
- Clear requirements
- Minimal design decisions
- **Action:** Switch to PLAN mode

### Level 3: Intermediate Feature
- Multiple components
- Design decisions required
- Integration considerations
- **Action:** Switch to PLAN mode → CREATIVE mode

### Level 4: Complex System
- Architectural changes
- Multiple phases
- Significant risk
- **Action:** Switch to PLAN mode → CREATIVE mode

## VAN Mode Output Format

```
╔═══════════════════════════════════════════════════════════════╗
║                    🚀 VAN MODE INITIALIZED                    ║
╠═══════════════════════════════════════════════════════════════╣
║ Platform: [macOS/Windows/Linux]                               ║
║ Memory Bank: [✓ Verified / ⚠ Created]                        ║
╠═══════════════════════════════════════════════════════════════╣
║ Task: [Task description]                                      ║
║ Complexity: Level [1/2/3/4] - [Type]                         ║
╠═══════════════════════════════════════════════════════════════╣
║ Next Step: [BUILD / PLAN mode]                               ║
╚═══════════════════════════════════════════════════════════════╝
```

## Workflow for Level 2-4 Tasks

When complexity is Level 2, 3, or 4:

```
🚫 LEVEL [2-4] TASK DETECTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This task requires detailed planning before implementation.

MANDATORY NEXT STEP:
→ Switch to PLAN mode for task planning
→ Use /plan command or wait for automatic transition
```

## Usage

Type `/van` followed by your task description:

```
/van Add drag-and-drop for kanban columns
```

Or just `/van` to initialize and then describe the task.

## Memory Bank Update

After VAN mode completes:
- `memory-bank/tasks.md` updated with task and complexity
- `memory-bank/activeContext.md` updated with current focus

## Next Steps

- **Level 1 tasks:** Proceed to `/build` command
- **Level 2-4 tasks:** Use `/plan` command (or automatic transition)
