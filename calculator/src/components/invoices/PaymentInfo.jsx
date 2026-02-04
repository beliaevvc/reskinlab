import { useState, useEffect, useMemo } from 'react';
import QRCode from 'react-qr-code';
import { useActiveWallets, NETWORK_INFO, getWalletAddress } from '../../hooks/useCryptoWallets';

export function PaymentInfo({ invoice, onNetworkChange }) {
  const { data: wallets, isLoading } = useActiveWallets();
  
  // Group wallets by currency
  const walletsByCurrency = useMemo(() => {
    if (!wallets) return {};
    return wallets.reduce((acc, wallet) => {
      if (!acc[wallet.currency]) acc[wallet.currency] = [];
      acc[wallet.currency].push(wallet);
      return acc;
    }, {});
  }, [wallets]);

  // Get available currencies
  const availableCurrencies = useMemo(() => {
    return Object.keys(walletsByCurrency);
  }, [walletsByCurrency]);

  // Default to invoice currency or first available
  const [selectedCurrency, setSelectedCurrency] = useState(
    invoice?.currency || 'USDT'
  );
  
  // Get networks for selected currency
  const availableNetworks = useMemo(() => {
    return walletsByCurrency[selectedCurrency] || [];
  }, [walletsByCurrency, selectedCurrency]);

  // Default to invoice network or first available
  const [selectedNetwork, setSelectedNetwork] = useState(
    invoice?.network || 'TRC20'
  );
  
  const [copied, setCopied] = useState(false);

  // Update selected currency when wallets load
  useEffect(() => {
    if (wallets && availableCurrencies.length > 0) {
      // If current currency not available, switch to first available
      if (!availableCurrencies.includes(selectedCurrency)) {
        setSelectedCurrency(availableCurrencies[0]);
      }
    }
  }, [wallets, availableCurrencies, selectedCurrency]);

  // Update selected network when currency changes
  useEffect(() => {
    if (availableNetworks.length > 0) {
      // If current network not available for this currency, switch to first available
      const hasNetwork = availableNetworks.some(w => w.network === selectedNetwork);
      if (!hasNetwork) {
        setSelectedNetwork(availableNetworks[0].network);
      }
    }
  }, [availableNetworks, selectedNetwork]);

  // Get wallet address for selected currency and network from active wallets
  const walletAddress = useMemo(() => {
    return getWalletAddress(wallets, selectedCurrency, selectedNetwork);
  }, [wallets, selectedCurrency, selectedNetwork]);

  const handleCurrencyChange = (currency) => {
    setSelectedCurrency(currency);
  };

  const handleNetworkChange = (network) => {
    setSelectedNetwork(network);
    onNetworkChange?.(network);
  };

  const handleCopy = async () => {
    if (!walletAddress) return;
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-md border border-neutral-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
        </div>
      </div>
    );
  }

  if (!wallets || wallets.length === 0) {
    return (
      <div className="bg-white rounded-md border border-neutral-200 p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">
          Payment Information
        </h3>
        <div className="bg-amber-50 border border-amber-200 rounded p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-medium text-amber-800">Payment methods not configured</p>
              <p className="text-sm text-amber-700 mt-1">
                Please contact support for payment details.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-md border border-neutral-200 p-6">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">
        Payment Information
      </h3>

      {/* Currency selector (if multiple currencies available) */}
      {availableCurrencies.length > 1 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Select Currency
          </label>
          <div className="flex gap-2">
            {availableCurrencies.map(currency => (
              <button
                key={currency}
                onClick={() => handleCurrencyChange(currency)}
                className={`flex-1 py-2 px-4 rounded border font-medium transition-colors ${
                  selectedCurrency === currency
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                <span className="font-bold">{currency}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Network selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Select Network
        </label>
        <div className="flex flex-wrap gap-2">
          {availableNetworks.map(wallet => {
            const networkInfo = NETWORK_INFO[wallet.network];
            return (
              <button
                key={wallet.id}
                onClick={() => handleNetworkChange(wallet.network)}
                className={`flex-1 min-w-[120px] py-2.5 px-4 rounded border font-medium transition-colors ${
                  selectedNetwork === wallet.network
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="font-bold">{wallet.network}</span>
                  <span className="text-xs opacity-75">({networkInfo?.blockchain})</span>
                </div>
                <div className="text-xs mt-1 opacity-75">{networkInfo?.fees}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Wallet address with QR code */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-neutral-700 mb-3">
          Wallet Address ({selectedCurrency} - {selectedNetwork})
        </label>
        
        {walletAddress ? (
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            {/* QR Code */}
            <div className="bg-white p-3 rounded-lg border border-neutral-200 shadow-sm">
              <QRCode
                value={walletAddress}
                size={140}
                style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                viewBox="0 0 256 256"
                level="M"
                fgColor="#1C1C1C"
              />
            </div>
            
            {/* Address and copy button */}
            <div className="flex-1 w-full">
              <div className="bg-neutral-50 rounded-lg border border-neutral-200 p-4">
                <div className="font-mono text-sm text-neutral-800 break-all leading-relaxed">
                  {walletAddress}
                </div>
                <button
                  onClick={handleCopy}
                  className={`mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                    copied
                      ? 'bg-emerald-500 text-white'
                      : 'bg-neutral-900 text-white hover:bg-neutral-800'
                  }`}
                >
                  {copied ? (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      Copy Address
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-neutral-500 mt-2 text-center sm:text-left">
                Scan QR code or copy address to your wallet
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-neutral-100 rounded-lg px-4 py-3 text-neutral-500">
            No wallet configured for this network
          </div>
        )}
      </div>

      {/* Compact warning */}
      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm">
        <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span className="text-amber-800">
          Send exactly <strong>{invoice?.amount_usd} {selectedCurrency}</strong> via <strong>{selectedNetwork}</strong> — wrong network = lost funds
        </span>
      </div>
    </div>
  );
}

export default PaymentInfo;
