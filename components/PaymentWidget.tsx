'use client';

import { useState } from 'react';
import { usePayment } from '@/lib/api-hooks';

interface PaymentModalProps {
  orderId: string;
  totalAmount: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PaymentModal({
  orderId,
  totalAmount,
  isOpen,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  const { loading, error, initiatePayment } = usePayment();
  const [localError, setLocalError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePayment = async () => {
    setLocalError(null);
    try {
      const result = await initiatePayment(orderId);

      if (result.ok && result.data?.url) {
        // Call onSuccess callback before redirect
        onSuccess?.();
        // Redirect to Midtrans payment page
        window.location.href = result.data.url;
      } else {
        setLocalError(result.error || 'Gagal membuat transaksi pembayaran');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan';
      setLocalError(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-2xl font-bold text-gray-800">Konfirmasi Pembayaran</h2>

        <div className="mb-6 rounded-lg bg-blue-50 p-4">
          <p className="text-sm text-gray-600">Total Pembayaran</p>
          <p className="text-3xl font-bold text-blue-600">
            Rp {totalAmount.toLocaleString('id-ID')}
          </p>
        </div>

        {(error || localError) && (
          <div className="mb-4 rounded-lg bg-red-50 p-3">
            <p className="text-sm text-red-700">{error || localError}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Batalkan
          </button>
          <button
            onClick={handlePayment}
            disabled={loading}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Memproses...' : 'Lanjutkan Pembayaran'}
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-gray-500">
          Anda akan diarahkan ke halaman pembayaran Midtrans
        </p>
      </div>
    </div>
  );
}

interface PaymentButtonProps {
  orderId: string;
  totalAmount: number;
  onSuccess?: () => void;
}

export function PaymentButton({ orderId, totalAmount, onSuccess }: PaymentButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSuccess = () => {
    setIsModalOpen(false);
    if (onSuccess) onSuccess();
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full rounded-lg bg-green-500 px-6 py-3 font-bold text-white transition-colors hover:bg-green-600"
      >
        Bayar Sekarang - Rp {totalAmount.toLocaleString('id-ID')}
      </button>

      <PaymentModal
        orderId={orderId}
        totalAmount={totalAmount}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
}
