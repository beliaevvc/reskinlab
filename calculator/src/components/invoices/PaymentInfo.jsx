import { useState } from 'react';
import { WALLET_ADDRESSES } from '../../lib/invoiceUtils';

export function PaymentInfo({ invoice, onNetworkChange }) {
  const [selectedNetwork, setSelectedNetwork] = useState(invoice?.network || 'TRC20');
  const [copied, setCopied] = useState(false);

  const walletAddress = invoice?.wallet_address || WALLET_ADDRESSES[selectedNetwork];

  const handleNetworkChange = (network) => {
    setSelectedNetwork(network);
    onNetworkChange?.(network);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="bg-white rounded-md border border-neutral-200 p-6">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">
        Payment Information
      </h3>

      {/* Network selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Select Network
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => handleNetworkChange('TRC20')}
            className={`flex-1 py-2.5 px-4 rounded border font-medium transition-colors ${
              selectedNetwork === 'TRC20'
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <span className="font-bold">TRC20</span>
              <span className="text-xs opacity-75">(Tron)</span>
            </div>
            <div className="text-xs mt-1 opacity-75">Low fees</div>
          </button>
          <button
            onClick={() => handleNetworkChange('ERC20')}
            className={`flex-1 py-2.5 px-4 rounded border font-medium transition-colors ${
              selectedNetwork === 'ERC20'
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <span className="font-bold">ERC20</span>
              <span className="text-xs opacity-75">(Ethereum)</span>
            </div>
            <div className="text-xs mt-1 opacity-75">Standard</div>
          </button>
        </div>
      </div>

      {/* Wallet address */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Wallet Address ({selectedNetwork})
        </label>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-neutral-100 rounded px-4 py-3 font-mono text-sm break-all">
            {walletAddress}
          </div>
          <button
            onClick={handleCopy}
            className={`shrink-0 p-3 rounded border transition-colors ${
              copied
                ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
                : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
            }`}
            title="Copy address"
          >
            {copied ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
            )}
          </button>
        </div>
        {copied && (
          <p className="text-sm text-emerald-600 mt-2">
            Address copied to clipboard!
          </p>
        )}
      </div>

      {/* Amount reminder */}
      <div className="bg-amber-50 border border-amber-200 rounded p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="font-medium text-amber-800">Important</p>
            <ul className="text-sm text-amber-700 mt-1 space-y-1">
              <li>• Send exactly {invoice?.amount_usd} USDT</li>
              <li>• Double-check the network ({selectedNetwork})</li>
              <li>• Wrong network = lost funds</li>
              <li>• Save your transaction hash</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentInfo;
