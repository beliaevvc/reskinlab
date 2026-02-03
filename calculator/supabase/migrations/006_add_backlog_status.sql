-- =============================================
-- ADD BACKLOG STATUS TO TASKS
-- Phase 7: Project Page Refactor
-- =============================================

-- Step 1: Drop existing constraint
ALTER TABLE public.tasks 
DROP CONSTRAINT IF EXISTS tasks_status_check;

-- Step 2: Add new constraint with backlog status
ALTER TABLE public.tasks
ADD CONSTRAINT tasks_status_check 
CHECK (status IN ('backlog', 'todo', 'in_progress', 'review', 'done'));

-- Step 3: (Optional) Move existing 'todo' tasks without stage to 'backlog'
-- Uncomment if you want to migrate existing tasks
-- UPDATE public.tasks 
-- SET status = 'backlog' 
-- WHERE status = 'todo' AND stage_id IS NULL;

-- Step 4: Add index for faster status filtering
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);

-- Verify the change
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'tasks_status_check';
