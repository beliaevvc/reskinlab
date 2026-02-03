-- Add rejected status to invoices
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_status_check;
ALTER TABLE invoices ADD CONSTRAINT invoices_status_check 
CHECK (status IN ('pending', 'awaiting_confirmation', 'paid', 'cancelled', 'overdue', 'rejected'));

-- Add rejection reason field
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- RLS policy for staff to update invoice status (confirm/reject payments)
DROP POLICY IF EXISTS "invoices_update_staff" ON public.invoices;

CREATE POLICY "invoices_update_staff"
ON public.invoices FOR UPDATE
USING (is_staff())
WITH CHECK (is_staff());
