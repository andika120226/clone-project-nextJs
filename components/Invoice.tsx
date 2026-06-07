'use client';

import { generateUniqueCode } from '@/lib/order-receipt';

interface OrderItemDisplay {
  product: {
    name: string;
    pricePerKg?: number;
  };
  quantityKg: number;
  unitPrice: number;
  subtotal: number;
}

interface InvoiceProps {
  orderId: string;
  trackingId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItemDisplay[];
  subtotal: number;
  logisticsCost: number;
  discountPercentage: number;
  total: number;
  status: string;
  createdAt?: string;
  paymentStatus?: string;
  onPrint?: () => void;
}

export function Invoice({
  orderId,
  trackingId,
  customerName,
  customerEmail,
  customerPhone,
  items,
  subtotal,
  logisticsCost,
  discountPercentage,
  total,
  status,
  createdAt,
  paymentStatus,
  onPrint,
}: InvoiceProps) {
  const sixDigitCode = generateUniqueCode(trackingId);
  const discountAmount = (subtotal * discountPercentage) / 100;
  const subtotalAfterDiscount = subtotal - discountAmount;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg">
      {/* Header */}
      <div className="mb-6 border-b-2 border-gray-200 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">InfoTani</h1>
            <p className="text-sm text-gray-600">Platform Jual-Beli Produk Tani</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-700">INVOICE</p>
            <p className="text-xs text-gray-600">#{sixDigitCode}</p>
          </div>
        </div>
      </div>

      {/* Order Info */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-semibold text-gray-600 uppercase">Order ID</p>
          <p className="text-sm text-gray-800">{orderId}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-600 uppercase">Tracking ID</p>
          <p className="text-sm text-gray-800">{trackingId}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-600 uppercase">Tanggal</p>
          <p className="text-sm text-gray-800">{formatDate(createdAt)}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-600 uppercase">Status</p>
          <p className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
            {status}
          </p>
        </div>
      </div>

      {/* Customer Info */}
      <div className="mb-6 rounded-lg bg-gray-50 p-4">
        <p className="mb-2 text-sm font-semibold text-gray-700">INFORMASI PELANGGAN</p>
        <div className="text-sm text-gray-700">
          <p>
            <span className="font-semibold">Nama:</span> {customerName}
          </p>
          <p>
            <span className="font-semibold">Email:</span> {customerEmail}
          </p>
          <p>
            <span className="font-semibold">Telepon:</span> {customerPhone}
          </p>
        </div>
      </div>

      {/* Items */}
      <div className="mb-6">
        <p className="mb-3 text-sm font-semibold text-gray-700 uppercase">Detail Pesanan</p>
        <div className="rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-2 text-left font-semibold text-gray-700">Produk</th>
                <th className="px-4 py-2 text-center font-semibold text-gray-700">Qty (kg)</th>
                <th className="px-4 py-2 text-right font-semibold text-gray-700">Harga/kg</th>
                <th className="px-4 py-2 text-right font-semibold text-gray-700">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} className="border-b last:border-0">
                  <td className="px-4 py-2 text-gray-700">{item.product.name}</td>
                  <td className="px-4 py-2 text-center text-gray-700">{item.quantityKg}</td>
                  <td className="px-4 py-2 text-right text-gray-700">{formatCurrency(item.unitPrice)}</td>
                  <td className="px-4 py-2 text-right font-semibold text-gray-700">
                    {formatCurrency(item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Calculation */}
      <div className="mb-6 space-y-2 rounded-lg bg-gray-50 p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal:</span>
          <span className="text-gray-800">{formatCurrency(subtotal)}</span>
        </div>
        {discountPercentage > 0 && (
          <>
            <div className="flex justify-between text-green-700">
              <span>Diskon ({discountPercentage}%):</span>
              <span>-{formatCurrency(discountAmount)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-300 pt-2">
              <span className="text-gray-600">Subtotal setelah diskon:</span>
              <span className="text-gray-800">{formatCurrency(subtotalAfterDiscount)}</span>
            </div>
          </>
        )}
        <div className="flex justify-between">
          <span className="text-gray-600">Biaya Pengiriman:</span>
          <span className="text-gray-800">{formatCurrency(logisticsCost)}</span>
        </div>
        <div className="border-t-2 border-gray-300 pt-2 text-lg font-bold">
          <div className="flex justify-between text-blue-600">
            <span>TOTAL:</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      {/* Payment Status */}
      {paymentStatus && (
        <div className={`mb-6 rounded-lg p-4 ${
          paymentStatus === 'SUCCESS'
            ? 'bg-green-50'
            : paymentStatus === 'PENDING'
              ? 'bg-yellow-50'
              : 'bg-red-50'
        }`}>
          <p className={`text-sm font-semibold ${
            paymentStatus === 'SUCCESS'
              ? 'text-green-700'
              : paymentStatus === 'PENDING'
                ? 'text-yellow-700'
                : 'text-red-700'
          }`}>
            Status Pembayaran: <span className="uppercase">{paymentStatus}</span>
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="border-t-2 border-gray-200 pt-4 text-center">
        <p className="text-xs text-gray-600">
          Terima kasih telah berbelanja di InfoTani
        </p>
        <p className="text-xs text-gray-500">
          Pesanan Anda akan segera diproses
        </p>
      </div>

      {/* Print Button */}
      {onPrint && (
        <button
          onClick={onPrint}
          className="mt-6 w-full rounded-lg border-2 border-blue-600 px-4 py-2 font-semibold text-blue-600 hover:bg-blue-50"
        >
          Cetak Invoice
        </button>
      )}
    </div>
  );
}
