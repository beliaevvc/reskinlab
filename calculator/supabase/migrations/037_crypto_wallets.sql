-- ===========================================
-- CRYPTO WALLETS FOR INVOICE PAYMENTS
-- Migration: 037_crypto_wallets.sql
-- ===========================================

-- ===========================================
-- 1. CREATE TABLE
-- ===========================================
CREATE TABLE public.crypto_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  currency TEXT NOT NULL CHECK (currency IN ('USDT', 'USDC')),
  network TEXT NOT NULL CHECK (network IN ('TRC20', 'ERC20', 'BSC', 'Polygon', 'Arbitrum', 'Base', 'Optimism')),
  address TEXT NOT NULL,
  label TEXT, -- optional description for admin reference
  is_active BOOLEAN DEFAULT true, -- whether to show to clients in invoices
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Prevent duplicate wallet addresses
  UNIQUE(currency, network, address)
);

-- Index for quick lookup of active wallets
CREATE INDEX idx_crypto_wallets_active ON public.crypto_wallets(is_active) WHERE is_active = true;

-- Index for filtering by currency
CREATE INDEX idx_crypto_wallets_currency ON public.crypto_wallets(currency);

-- ===========================================
-- 2. UPDATED_AT TRIGGER
-- ===========================================
CREATE OR REPLACE FUNCTION update_crypto_wallets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_crypto_wallets_updated_at
  BEFORE UPDATE ON public.crypto_wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_crypto_wallets_updated_at();

-- ===========================================
-- 3. RLS POLICIES
-- ===========================================
ALTER TABLE public.crypto_wallets ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read active wallets (for payment info)
CREATE POLICY "Anyone can read active wallets"
  ON public.crypto_wallets
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Admin can read all wallets (including inactive)
CREATE POLICY "Admin can read all wallets"
  ON public.crypto_wallets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin can insert wallets
CREATE POLICY "Admin can insert wallets"
  ON public.crypto_wallets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin can update wallets
CREATE POLICY "Admin can update wallets"
  ON public.crypto_wallets
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin can delete wallets
CREATE POLICY "Admin can delete wallets"
  ON public.crypto_wallets
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ===========================================
-- 4. SEED DEFAULT WALLETS (optional)
-- ===========================================
-- Insert some example wallets (commented out - uncomment if needed)
-- INSERT INTO public.crypto_wallets (currency, network, address, label, is_active) VALUES
--   ('USDT', 'TRC20', 'TYDzsYUEpvnYmQk4zGP9sWWcTEd2MiAtW7', 'Main USDT TRC20', true),
--   ('USDT', 'ERC20', '0x742d35Cc6634C0532925a3b844Bc9e7595f0aB1d', 'Main USDT ERC20', true);
