import React, { useEffect, useState } from 'react';
import { QRCodeItem, BusinessProfile } from '../types';
import { generateQRCodeDataUrl, downloadQRCodeImage, printQRCodeTentCard } from '../utils/qrHelper';
import { X, Download, Printer, Copy, Check, ExternalLink, Sparkles, AlertCircle } from 'lucide-react';

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrCode: QRCodeItem | null;
  business: BusinessProfile | null;
  onOpenCustomerFlow?: (qrId: string) => void;
}

export const QRModal: React.FC<QRModalProps> = ({
  isOpen,
  onClose,
  qrCode,
  business,
  onOpenCustomerFlow,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(true);

  const publicUrl = qrCode && business
    ? `${window.location.origin}/r/${business.slug || business.id}/${qrCode.id}`
    : '';

  useEffect(() => {
    if (isOpen && qrCode && business) {
      setGenerating(true);
      const url = `${window.location.origin}/r/${business.slug || business.id}/${qrCode.id}`;
      generateQRCodeDataUrl(url)
        .then((dataUrl) => {
          setQrDataUrl(dataUrl);
          setGenerating(false);
        })
        .catch(() => setGenerating(false));
    }
  }, [isOpen, qrCode, business]);

  if (!isOpen || !qrCode || !business) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy link error:', err);
    }
  };

  const handleDownload = () => {
    if (qrDataUrl) {
      const filename = `${business.name.toLowerCase().replace(/\s+/g, '-')}-${qrCode.name.toLowerCase().replace(/\s+/g, '-')}-qr.png`;
      downloadQRCodeImage(qrDataUrl, filename);
    }
  };

  const handlePrint = () => {
    if (qrDataUrl) {
      printQRCodeTentCard(business.name, qrCode.location || qrCode.name, qrDataUrl);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          id="qr-modal-close-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 font-semibold text-xs rounded-full uppercase tracking-wider mb-2">
            Customer Experience QR
          </span>
          <h3 className="text-xl font-extrabold text-slate-900">{qrCode.name}</h3>
          <p className="text-xs text-slate-500 mt-1">Location: {qrCode.location || 'Default'}</p>
        </div>

        {/* QR Code Frame */}
        <div className="flex flex-col items-center justify-center bg-slate-50 border border-slate-200/80 rounded-2xl p-6 mb-5">
          {generating ? (
            <div className="w-56 h-56 flex items-center justify-center">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : qrDataUrl ? (
            <div className="relative group">
              <img
                src={qrDataUrl}
                alt={`QR code for ${qrCode.name}`}
                className="w-56 h-56 rounded-xl shadow-sm bg-white p-2 border border-slate-100"
              />
            </div>
          ) : (
            <div className="w-56 h-56 flex flex-col items-center justify-center text-slate-400 text-xs">
              <AlertCircle className="w-8 h-8 text-rose-500 mb-2" />
              <span>Failed to generate QR code</span>
            </div>
          )}

          <div className="text-center mt-3">
            <span className="text-[11px] font-semibold text-slate-700">
              Directs customer to {business.name} Feedback Flow
            </span>
          </div>
        </div>

        {/* Public Link Box */}
        <div className="flex items-center gap-2 bg-slate-100/80 rounded-xl p-2 mb-5 border border-slate-200">
          <div className="flex-1 px-2 text-xs font-mono text-slate-600 truncate">
            {publicUrl}
          </div>
          <button
            id="qr-copy-url-btn"
            onClick={handleCopyLink}
            className="flex items-center gap-1 px-3 py-1.5 bg-white text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-bold rounded-lg shadow-2xs hover:bg-slate-50 transition-all shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy URL</span>
              </>
            )}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <button
            id="qr-download-btn"
            onClick={handleDownload}
            disabled={!qrDataUrl}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download PNG</span>
          </button>

          <button
            id="qr-print-btn"
            onClick={handlePrint}
            disabled={!qrDataUrl}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print Standee Card</span>
          </button>
        </div>

        {/* Test Scan / Customer flow button */}
        <button
          id="qr-test-flow-btn"
          onClick={() => {
            if (onOpenCustomerFlow) {
              onClose();
              onOpenCustomerFlow(qrCode.id);
            } else {
              window.open(publicUrl, '_blank');
            }
          }}
          className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Test Customer Feedback Flow</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
