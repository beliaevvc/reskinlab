# PLAN Command - Task Planning

This command creates detailed implementation plans based on complexity level determined in VAN mode.

## CRITICAL: Mode Switch Required

**При вызове `/plan` агент ДОЛЖЕН:**
1. Переключиться в режим Plan (read-only режим для планирования)
2. Следовать инструкциям Memory Bank для создания плана
3. Использовать Ask Questions подход для уточнения требований

**Команда для переключения режима:**
```
SwitchMode → target_mode_id: "plan"
```

## Memory Bank Integration

Reads from:
- `memory-bank/tasks.md` - Task requirements and complexity level
- `memory-bank/activeContext.md` - Current project context
- `memory-bank/projectbrief.md` - Project foundation (if exists)
- `memory-bank/systemPatterns.md` - System architecture patterns

Updates:
- `memory-bank/tasks.md` - Adds detailed implementation plan
- `memory-bank/activeContext.md` - Updates current focus

## Planning Workflow (Following Memory Bank)

### Phase 1: Context Analysis
1. **Read Memory Bank files:**
   - `memory-bank/tasks.md` for task context
   - `memory-bank/activeContext.md` for current state
   - `memory-bank/progress.md` for recent work

2. **Determine Complexity Level:**
   - Level 1: Quick fix (skip to BUILD)
   - Level 2: Simple enhancement
   - Level 3: Intermediate feature
   - Level 4: Complex system change

### Phase 2: Ask Questions (MANDATORY for Level 2-4)
Before creating a plan, ASK QUESTIONS to clarify:
- Exact requirements and scope
- User preferences for implementation
- Constraints and limitations
- Priority of features
- Integration points

### Phase 3: Create Implementation Plan
Based on complexity level:

**Level 2 (Simple Enhancement):**
- Document planned changes
- List files to modify
- Create step-by-step implementation

**Level 3 (Feature):**
- Comprehensive requirements
- Component breakdown
- Dependencies mapping
- Challenges & mitigations

**Level 4 (Complex System):**
- Phased implementation plan
- Architectural considerations
- Risk assessment
- Multiple creative phases

### Phase 4: Technology Validation
- Document technology stack
- Verify dependencies
- Create proof of concept if needed

### Phase 5: Identify Creative Phases
For Level 3-4:
- Flag UI/UX decisions needed
- Flag architecture decisions needed
- Flag data model decisions needed

### Phase 6: Update Memory Bank
- Update `memory-bank/tasks.md` with complete plan
- Update `memory-bank/activeContext.md`
- Mark planning phase as complete

## Plan Document Format (in tasks.md)

```markdown
# Task: [Task Name]

## Description
[Detailed description from user]

## Complexity
Level: [2/3/4]
Type: [Enhancement/Feature/Complex System]

## Questions Answered
- Q1: [Question] → A: [Answer]
- Q2: [Question] → A: [Answer]

## Implementation Plan
### Phase 1: [Name]
- [ ] Step 1.1
- [ ] Step 1.2

### Phase 2: [Name]
- [ ] Step 2.1
- [ ] Step 2.2

## Files to Modify
- `path/to/file1.ts` - [Description]
- `path/to/file2.tsx` - [Description]

## Creative Phases Required
- [ ] [Component] UI Design
- [ ] [Component] Architecture

## Dependencies
- [Dependency 1]
- [Dependency 2]

## Challenges & Mitigations
- Challenge 1: [Mitigation]
- Challenge 2: [Mitigation]

## Status
- [x] Planning complete
- [ ] Creative phases (if needed)
- [ ] Implementation
- [ ] Testing
```

## Usage

Type `/plan` to start planning. The agent will:
1. Switch to Plan mode
2. Read Memory Bank context
3. Ask clarifying questions
4. Create detailed implementation plan
5. Update Memory Bank

## Next Steps

- **If creative phases identified:** Use `/creative` command
- **If no creative phases:** Proceed to `/build` command
