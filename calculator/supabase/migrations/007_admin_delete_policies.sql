-- ===========================================
-- ADD DELETE POLICIES FOR ADMIN
-- ===========================================

-- Admin can delete offer_acceptance_logs
DROP POLICY IF EXISTS "offer_logs_delete_admin" ON public.offer_acceptance_logs;
CREATE POLICY "offer_logs_delete_admin"
ON public.offer_acceptance_logs FOR DELETE
USING (is_admin());

-- Admin can delete invoices  
DROP POLICY IF EXISTS "invoices_delete_admin" ON public.invoices;
CREATE POLICY "invoices_delete_admin"
ON public.invoices FOR DELETE
USING (is_admin());

-- Admin can delete offers
DROP POLICY IF EXISTS "offers_delete_admin" ON public.offers;
CREATE POLICY "offers_delete_admin"
ON public.offers FOR DELETE
USING (is_admin());

-- Admin can delete specifications
DROP POLICY IF EXISTS "specifications_delete_admin" ON public.specifications;
CREATE POLICY "specifications_delete_admin"
ON public.specifications FOR DELETE
USING (is_admin());
