'use client';

/**
 * Order History & Receipt Utilities
 * Handles payment history, receipts with 6-digit unique codes, and order formatting
 */

export interface OrderReceipt {
  codeUnique: string; // 6-digit code
  orderId: string;
  trackingId: string;
  customerName: string;
  customerEmail?: string;
  farmerName: string;
  createdDate: string;
  createdTime: string;
  products: Array<{
    name: string;
    quantityKg: number;
    unitPrice: number;
    subtotal: number;
  }>;
  subtotal: number;
  logisticsCost: number;
  total: number;
  paymentMethod: string;
  deliveryStatus: string;
  deliveryAddress?: string;
  logisticsVehicle?: string;
}

/**
 * Generate 6-digit unique code based on order ID and timestamp
 * Ensures code is deterministic for same order
 */
export function generateUniqueCode(orderId: string, timestamp?: Date): string {
  const date = timestamp || new Date();
  const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
  const combined = `${orderId}${dateStr}`;

  // Create hash from combined string
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Extract 6 digits from hash
  const code = Math.abs(hash)
    .toString()
    .slice(0, 6)
    .padStart(6, '0');

  return code;
}

/**
 * Format date to local Indonesian format (DD/MM/YYYY HH:MM)
 */
export function formatDateForReceipt(dateString: string): { date: string; time: string } {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  };
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
  };

  const formattedDate = date.toLocaleDateString('id-ID', options);
  const formattedTime = date.toLocaleTimeString('id-ID', timeOptions);

  return {
    date: formattedDate,
    time: formattedTime,
  };
}

/**
 * Format currency to Indonesian Rupiah
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Build receipt object from order data
 */
export function buildOrderReceipt(order: {
  id: string;
  trackingId: string;
  customer?: { name: string; email?: string };
  farmer?: { name: string };
  createdAt?: string;
  items?: Array<{
    product?: { name: string };
    quantityKg: number;
    unitPrice: number;
    subtotal: number;
  }>;
  subtotal: number;
  logisticsCost: number;
  total: number;
  status?: string;
  logisticsVehicle?: { name: string };
  address?: { fullAddress: string };
  customerBankAccount?: { bankName: string };
}): OrderReceipt {
  const createdDate = order.createdAt || new Date().toISOString();
  const { date: dateStr, time: timeStr } = formatDateForReceipt(createdDate);
  const codeUnique = generateUniqueCode(order.id);

  const products =
    order.items?.map((item) => ({
      name: item.product?.name || 'Product',
      quantityKg: item.quantityKg,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal,
    })) || [];

  return {
    codeUnique,
    orderId: order.id,
    trackingId: order.trackingId,
    customerName: order.customer?.name || 'Customer',
    customerEmail: order.customer?.email,
    farmerName: order.farmer?.name || 'Farmer',
    createdDate: dateStr,
    createdTime: timeStr,
    products,
    subtotal: order.subtotal,
    logisticsCost: order.logisticsCost,
    total: order.total,
    paymentMethod: order.customerBankAccount?.bankName || 'Payment Method',
    deliveryStatus: order.status || 'PENDING',
    deliveryAddress: order.address?.fullAddress,
    logisticsVehicle: order.logisticsVehicle?.name,
  };
}

/**
 * Generate printable receipt HTML
 */
export function generateReceiptHTML(receipt: OrderReceipt): string {
  const statusBadge = {
    PENDING: '⏳ Pending',
    CONFIRMED: '✅ Confirmed',
    PROCESSING: '📦 Processing',
    SHIPPED: '🚚 Shipped',
    DELIVERED: '🎉 Delivered',
    CANCELLED: '❌ Cancelled',
  };

  const status = statusBadge[receipt.deliveryStatus as keyof typeof statusBadge] || receipt.deliveryStatus;

  const productRows = receipt.products
    .map(
      (product) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${product.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e0e0e0; text-align: center;">${product.quantityKg} kg</td>
      <td style="padding: 8px; border-bottom: 1px solid #e0e0e0; text-align: right;">${formatRupiah(product.unitPrice)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e0e0e0; text-align: right; font-weight: bold;">${formatRupiah(product.subtotal)}</td>
    </tr>
  `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Kwitansi InfoTani - ${receipt.codeUnique}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background: #f9f9f9;
        }
        .receipt {
          background: white;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #2d5016;
          padding-bottom: 15px;
        }
        .header h1 {
          margin: 0;
          color: #2d5016;
          font-size: 24px;
        }
        .header p {
          margin: 5px 0;
          color: #666;
          font-size: 12px;
        }
        .code-unique {
          background: #f0f8ff;
          border: 2px dashed #2d5016;
          padding: 10px;
          border-radius: 4px;
          text-align: center;
          font-weight: bold;
          font-size: 18px;
          margin: 15px 0;
          letter-spacing: 2px;
        }
        .order-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin: 20px 0;
          padding: 15px;
          background: #f9f9f9;
          border-radius: 4px;
        }
        .info-group {
          font-size: 13px;
        }
        .info-group strong {
          display: block;
          color: #2d5016;
          margin-bottom: 5px;
        }
        .info-group p {
          margin: 3px 0;
          color: #666;
        }
        table {
          width: 100%;
          margin: 20px 0;
          border-collapse: collapse;
        }
        th {
          background: #2d5016;
          color: white;
          padding: 10px;
          text-align: left;
          font-size: 13px;
        }
        th:nth-child(3),
        th:nth-child(4),
        td:nth-child(3),
        td:nth-child(4) {
          text-align: right;
        }
        .summary {
          background: #f9f9f9;
          padding: 15px;
          border-radius: 4px;
          margin: 20px 0;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          margin: 8px 0;
          font-size: 14px;
        }
        .summary-row strong {
          color: #2d5016;
        }
        .total {
          font-size: 18px;
          font-weight: bold;
          color: #2d5016;
          border-top: 2px solid #ddd;
          padding-top: 10px;
          margin-top: 10px;
        }
        .status {
          display: inline-block;
          padding: 8px 12px;
          border-radius: 4px;
          font-weight: bold;
          margin: 10px 0;
          background: #e8f5e9;
          color: #2d5016;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 15px;
          border-top: 1px solid #ddd;
          color: #666;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          <h1>🌾 InfoTani Marketplace</h1>
          <p>Kwitansi Pemesanan / Order Receipt</p>
        </div>

        <div class="code-unique">
          Kode Unik: ${receipt.codeUnique}
        </div>

        <div class="order-info">
          <div class="info-group">
            <strong>Tanggal Pesanan</strong>
            <p>${receipt.createdDate} ${receipt.createdTime}</p>
          </div>
          <div class="info-group">
            <strong>No. Tracking</strong>
            <p>${receipt.trackingId}</p>
          </div>
          <div class="info-group">
            <strong>Pembeli</strong>
            <p>${receipt.customerName}</p>
          </div>
          <div class="info-group">
            <strong>Penjual (Petani)</strong>
            <p>${receipt.farmerName}</p>
          </div>
        </div>

        <div class="status">${status}</div>

        <h3 style="margin-top: 20px; color: #2d5016;">Daftar Produk</h3>
        <table>
          <thead>
            <tr>
              <th>Nama Produk</th>
              <th>Qty</th>
              <th>Harga/Unit</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${productRows}
          </tbody>
        </table>

        <div class="summary">
          <div class="summary-row">
            <span>Subtotal Produk:</span>
            <strong>${formatRupiah(receipt.subtotal)}</strong>
          </div>
          <div class="summary-row">
            <span>Biaya Logistik${receipt.logisticsVehicle ? ` (${receipt.logisticsVehicle})` : ''}:</span>
            <strong>${formatRupiah(receipt.logisticsCost)}</strong>
          </div>
          <div class="summary-row total">
            <span>Total Pembayaran:</span>
            <span>${formatRupiah(receipt.total)}</span>
          </div>
        </div>

        <div style="margin-top: 15px; padding: 10px; background: #f9f9f9; border-radius: 4px; font-size: 13px;">
          <strong>Metode Pembayaran:</strong> ${receipt.paymentMethod}
          ${receipt.deliveryAddress ? `<br><strong>Alamat Pengiriman:</strong> ${receipt.deliveryAddress}` : ''}
        </div>

        <div class="footer">
          <p>Terima kasih telah berbelanja di InfoTani Marketplace</p>
          <p>Untuk pertanyaan atau bantuan, hubungi: support@infotani.id</p>
          <p style="margin-top: 10px; color: #999; font-size: 11px;">
            Dokumen ini dicetak otomatis oleh sistem InfoTani | Bukan bukti pembayaran yang sah
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Export receipt as CSV row for history table
 */
export function receiptToCSVRow(receipt: OrderReceipt): string {
  const productSummary = receipt.products.map((p) => `${p.name} (${p.quantityKg}kg)`).join('; ');
  const fields = [
    receipt.codeUnique,
    receipt.customerName,
    `${receipt.createdDate} ${receipt.createdTime}`,
    formatRupiah(receipt.total),
    receipt.paymentMethod,
    productSummary,
  ];

  return fields.map((field) => `"${field.replace(/"/g, '""')}"`).join(',');
}
