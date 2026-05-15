'use client';

import { useEffect, useState } from 'react';
import { useAdminOrders } from '@/lib/api-hooks';

interface AdminOrdersProps {
  onOrderSelect?: (orderId: string) => void;
}

export function AdminOrdersDashboard({ onOrderSelect }: AdminOrdersProps) {
  const { orders, pagination, loading, error, fetchOrders, updateOrderStatus } = useAdminOrders();
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [updateMessage, setUpdateMessage] = useState('');

  const statuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

  useEffect(() => {
    fetchOrders(selectedStatus || undefined, currentPage);
  }, [selectedStatus, currentPage, fetchOrders]);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingOrderId(orderId);
      await updateOrderStatus(orderId, newStatus, updateMessage);
      setUpdateMessage('');
      setUpdatingOrderId(null);
    } catch (err) {
      console.error('Status update error:', err);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-blue-100 text-blue-800',
      PROCESSING: 'bg-purple-100 text-purple-800',
      SHIPPED: 'bg-orange-100 text-orange-800',
      DELIVERED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Pesanan</h1>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Status Filter */}
      <div className="flex gap-2 overflow-x-auto">
        <button
          onClick={() => {
            setSelectedStatus('');
            setCurrentPage(1);
          }}
          className={`whitespace-nowrap rounded-full px-4 py-2 font-medium transition-colors ${
            selectedStatus === ''
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Semua
        </button>
        {statuses.map((status) => (
          <button
            key={status}
            onClick={() => {
              setSelectedStatus(status);
              setCurrentPage(1);
            }}
            className={`whitespace-nowrap rounded-full px-4 py-2 font-medium transition-colors ${
              selectedStatus === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <p className="text-gray-600">Memuat pesanan...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex justify-center py-12">
          <p className="text-gray-600">Tidak ada pesanan</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
              {/* Order Header */}
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800">Order #{order.trackingId}</p>
                  <p className="text-sm text-gray-600">Dari: {order.customer?.name || '-'}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>

              {/* Items */}
              <div className="mb-4 space-y-2 rounded-lg bg-gray-50 p-3">
                <p className="text-sm font-semibold text-gray-700">Produk:</p>
                {order.items?.map((item, idx: number) => (
                  <div key={idx} className="text-sm text-gray-600">
                    • {item.product?.name} - {item.quantityKg} kg @ Rp {item.unitPrice.toLocaleString('id-ID')}
                  </div>
                ))}
              </div>

              {/* Amount */}
              <div className="mb-4 flex justify-between border-t pt-4">
                <span className="text-gray-600">Total:</span>
                <span className="font-bold text-lg text-blue-600">{formatCurrency(order.total)}</span>
              </div>

              {/* Payment Status */}
              {order.payment && (
                <div className="mb-4 rounded-lg bg-blue-50 p-3">
                  <p className={`text-sm font-semibold ${
                    order.payment.status === 'SUCCESS' ? 'text-green-700' : 'text-yellow-700'
                  }`}>
                    Pembayaran: {order.payment.status}
                  </p>
                </div>
              )}

              {/* Status Update Section */}
              <div className="space-y-3 border-t pt-4">
                <p className="text-sm font-semibold text-gray-700">Update Status:</p>
                <div className="flex flex-wrap gap-2">
                  {statuses.map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusUpdate(order.id, status)}
                      disabled={updatingOrderId === order.id}
                      className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                        order.status === status
                          ? 'bg-gray-300 text-gray-600 cursor-default'
                          : 'bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50'
                      }`}
                    >
                      {updatingOrderId === order.id ? 'Mengupdate...' : status}
                    </button>
                  ))}
                </div>

                {updatingOrderId === order.id && (
                  <input
                    type="text"
                    value={updateMessage}
                    onChange={(e) => setUpdateMessage(e.target.value)}
                    placeholder="Pesan (opsional)"
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                )}
              </div>

              {/* Messages */}
              {order.messages && order.messages.length > 0 && (
                <div className="mt-4 space-y-2 border-t pt-4">
                  <p className="text-sm font-semibold text-gray-700">Pesan Terbaru:</p>
                  {order.messages.slice(0, 3).map((msg, idx: number) => (
                    <div key={idx} className="text-xs text-gray-600">
                      <span className="font-semibold">{msg.sender}:</span> {msg.message}
                    </div>
                  ))}
                </div>
              )}

              {/* View Detail Button */}
              {onOrderSelect && (
                <button
                  onClick={() => onOrderSelect(order.id)}
                  className="mt-4 w-full rounded-lg border-2 border-blue-600 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
                >
                  Lihat Detail
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="rounded px-3 py-2 disabled:opacity-50"
          >
            ←
          </button>
          <span className="text-sm text-gray-600">
            {currentPage} / {pagination.pages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
            disabled={currentPage === pagination.pages}
            className="rounded px-3 py-2 disabled:opacity-50"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
