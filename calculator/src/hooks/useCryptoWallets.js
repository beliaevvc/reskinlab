import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { logCryptoWalletEvent } from '../lib/auditLog';

/**
 * Fetch all crypto wallets (for admin)
 */
export function useCryptoWallets() {
  return useQuery({
    queryKey: ['crypto-wallets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crypto_wallets')
        .select('*')
        .order('currency', { ascending: true })
        .order('network', { ascending: true });

      if (error) throw error;
      return data;
    },
  });
}

/**
 * Fetch only active wallets (for clients/payment info)
 */
export function useActiveWallets() {
  return useQuery({
    queryKey: ['crypto-wallets', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crypto_wallets')
        .select('*')
        .eq('is_active', true)
        .order('currency', { ascending: true })
        .order('network', { ascending: true });

      if (error) throw error;
      return data;
    },
  });
}

/**
 * Create a new crypto wallet
 */
export function useCreateWallet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (wallet) => {
      const { data, error } = await supabase
        .from('crypto_wallets')
        .insert({
          currency: wallet.currency,
          network: wallet.network,
          address: wallet.address.trim(),
          label: wallet.label?.trim() || null,
          is_active: wallet.isActive ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['crypto-wallets'] });
      logCryptoWalletEvent('create_wallet', data.id, { currency: data.currency, network: data.network });
    },
  });
}

/**
 * Update an existing crypto wallet
 */
export function useUpdateWallet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const updateData = {};
      
      if (updates.currency !== undefined) updateData.currency = updates.currency;
      if (updates.network !== undefined) updateData.network = updates.network;
      if (updates.address !== undefined) updateData.address = updates.address.trim();
      if (updates.label !== undefined) updateData.label = updates.label?.trim() || null;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

      const { data, error } = await supabase
        .from('crypto_wallets')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['crypto-wallets'] });
      logCryptoWalletEvent('update_wallet', data.id, { currency: data.currency, network: data.network });
    },
  });
}

/**
 * Delete a crypto wallet
 */
export function useDeleteWallet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      // Fetch wallet info before deletion for audit log
      const { data: walletData } = await supabase
        .from('crypto_wallets')
        .select('currency, network')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('crypto_wallets')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, currency: walletData?.currency, network: walletData?.network };
    },
    onSuccess: ({ id, currency, network }) => {
      queryClient.invalidateQueries({ queryKey: ['crypto-wallets'] });
      logCryptoWalletEvent('delete_wallet', id, { currency, network });
    },
  });
}

/**
 * Toggle wallet active status
 */
export function useToggleWallet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }) => {
      const { data, error } = await supabase
        .from('crypto_wallets')
        .update({ is_active: isActive })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['crypto-wallets'] });
      logCryptoWalletEvent('toggle_wallet', data.id, { is_active: data.is_active, currency: data.currency });
    },
  });
}

/**
 * Get available networks for a currency from active wallets
 */
export function getAvailableNetworks(wallets, currency) {
  if (!wallets) return [];
  return wallets
    .filter(w => w.currency === currency && w.is_active)
    .map(w => w.network);
}

/**
 * Get wallet address by currency and network
 */
export function getWalletAddress(wallets, currency, network) {
  if (!wallets) return null;
  const wallet = wallets.find(
    w => w.currency === currency && w.network === network && w.is_active
  );
  return wallet?.address || null;
}

/**
 * Network display info
 */
export const NETWORK_INFO = {
  TRC20: { name: 'TRC20', blockchain: 'Tron', fees: 'Low fees' },
  ERC20: { name: 'ERC20', blockchain: 'Ethereum', fees: 'Standard' },
  BSC: { name: 'BSC', blockchain: 'BNB Smart Chain', fees: 'Low fees' },
  Polygon: { name: 'Polygon', blockchain: 'Polygon', fees: 'Very low fees' },
  Arbitrum: { name: 'Arbitrum', blockchain: 'Arbitrum One', fees: 'Low fees' },
  Base: { name: 'Base', blockchain: 'Base', fees: 'Low fees' },
  Optimism: { name: 'Optimism', blockchain: 'Optimism', fees: 'Low fees' },
};

/**
 * All supported currencies
 */
export const SUPPORTED_CURRENCIES = ['USDT', 'USDC'];

/**
 * All supported networks
 */
export const SUPPORTED_NETWORKS = ['TRC20', 'ERC20', 'BSC', 'Polygon', 'Arbitrum', 'Base', 'Optimism'];
