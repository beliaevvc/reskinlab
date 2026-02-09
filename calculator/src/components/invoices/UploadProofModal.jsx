import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useUploadPaymentProof } from '../../hooks/useInvoices';
import { formatInvoiceAmount } from '../../lib/invoiceUtils';

export function UploadProofModal({ isOpen, onClose, invoice }) {
  const { t } = useTranslation('invoices');
  const [file, setFile] = useState(null);
  const [txHash, setTxHash] = useState('');
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const { mutate: uploadProof, isPending, error } = useUploadPaymentProof();

  if (!isOpen || !invoice) return null;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Create preview for images
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result);
        reader.readAsDataURL(selectedFile);
      } else {
        setPreview(null);
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
      if (droppedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result);
        reader.readAsDataURL(droppedFile);
      }
    }
  };

  const handleSubmit = () => {
    if (!file) return;

    uploadProof(
      {
        invoiceId: invoice.id,
        file,
        txHash: txHash.trim() || null,
      },
      {
        onSuccess: () => {
          onClose();
          setFile(null);
          setTxHash('');
          setPreview(null);
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded shadow-xl max-w-lg w-full mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200">
          <h2 className="text-xl font-semibold text-neutral-900">
            {t('uploadProof.title')}
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            {t('uploadProof.subtitle', { number: invoice.number, amount: formatInvoiceAmount(invoice.amount_usd) })}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Drop zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-md p-8 text-center cursor-pointer transition-colors ${
              file
                ? 'border-emerald-300 bg-emerald-50'
                : 'border-neutral-300 hover:border-emerald-300 hover:bg-neutral-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            {preview ? (
              <div className="space-y-3">
                <img
                  src={preview}
                  alt="Preview"
                  className="max-h-48 mx-auto rounded"
                />
                <p className="text-sm text-emerald-600 font-medium">
                  {file.name}
                </p>
              </div>
            ) : file ? (
              <div className="space-y-2">
                <svg
                  className="w-12 h-12 mx-auto text-emerald-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="text-sm text-emerald-600 font-medium">
                  {file.name}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <svg
                  className="w-12 h-12 mx-auto text-neutral-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-neutral-600">
                  {t('uploadProof.dropzone')}
                </p>
                <p className="text-sm text-neutral-400">
                  {t('uploadProof.dropzoneFormats')}
                </p>
              </div>
            )}
          </div>

          {/* Transaction hash */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t('uploadProof.txHashLabel')}
            </label>
            <input
              type="text"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              placeholder={t('uploadProof.txHashPlaceholder')}
              className="w-full px-4 py-2.5 border border-neutral-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono text-sm"
            />
            <p className="text-xs text-neutral-500 mt-1">
              {t('uploadProof.txHashHint')}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-sm text-red-700">
                {t('uploadProof.uploadFailed', { error: error.message })}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-neutral-700 font-medium hover:bg-neutral-100 rounded transition-colors"
          >
            {t('actions.cancel', { ns: 'common', defaultValue: 'Cancel' })}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!file || isPending}
            className={`flex items-center gap-2 px-6 py-2.5 rounded font-medium transition-colors ${
              file
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                : 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
            }`}
          >
            {isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                {t('uploadProof.uploading')}
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                {t('uploadProof.uploadButton')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default UploadProofModal;
