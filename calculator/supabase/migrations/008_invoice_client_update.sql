-- Allow clients to update their own invoices (for tx_hash and status)
-- Only allows updating specific fields for pending invoices

DROP POLICY IF EXISTS "invoices_update_client" ON public.invoices;

CREATE POLICY "invoices_update_client"
ON public.invoices FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = invoices.project_id
    AND p.client_id = (SELECT id FROM clients WHERE user_id = auth.uid())
  )
  AND status = 'pending'  -- Only pending invoices can be updated by client
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = invoices.project_id
    AND p.client_id = (SELECT id FROM clients WHERE user_id = auth.uid())
  )
  AND status IN ('pending', 'awaiting_confirmation')  -- Can only set to these statuses
);
