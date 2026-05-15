# InfoTani Payment & Order Management - Implementation Guide

## 🎯 Fitur yang Diimplementasikan

### 1. **Sistem Pembayaran (Midtrans Integration)**
- Integrasi Midtrans Snap untuk multiple payment methods (QRIS, Credit Card, Bank Transfer, E-Wallet)
- Payment initiation endpoint
- Webhook handler untuk payment confirmation
- Payment status tracking

### 2. **Product Image Management**
- Upload image produk (JPG, PNG, WebP)
- Limit: 1 gambar primary per produk
- Max file size: 5MB
- Auto-stored di `/public/uploads/products/`

### 3. **Dynamic Pricing (Harga per Kg)**
- Admin/Farmer bisa update harga per kg produk kapan saja
- Price update reflected immediately di katalog

### 4. **Order Management System**
- Admin dapat melihat semua orders dengan status filter
- Update order status: PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
- Add messages/notes untuk setiap order update
- View order details dengan customer & items info

### 5. **Invoice/Receipt Generation**
- 6-digit unique code untuk setiap order
- Display invoice dengan detail lengkap
- Printable format
- Show payment status

## 🛠️ Environment Setup

### Add Midtrans Keys to `.env`
```
MIDTRANS_SERVER_KEY="SB-Mid-server-xxxxxxxx"
MIDTRANS_CLIENT_KEY="SB-Mid-client-xxxxxxxx"
```

Get keys from: https://dashboard.midtrans.com/account/credentials

## 📡 API Endpoints

### Payment APIs
```
POST /api/orders/{orderId}/payment
- Initiate payment transaction
- Response: { token, url, orderId }

POST /api/webhooks/payment
- Midtrans webhook callback
- Auto-updates order status to CONFIRMED on success
- Creates notification message for farmer
```

### Product Management APIs
```
POST /api/products/{productId}/images
- Upload product image
- Form data: { image: File }
- Response: { imageUrl, isPrimary }

GET /api/products/{productId}/images
- Fetch all images for product

PATCH /api/products/{productId}/pricing
- Update price per kg
- Body: { pricePerKg: number }
```

### Admin Order APIs
```
GET /api/admin/orders?status=PENDING&page=1&limit=10
- List orders with pagination
- Filter by status
- Response includes items, payment, messages

GET /api/admin/orders/{orderId}
- Get order detail

PATCH /api/admin/orders/{orderId}
- Update order status
- Add message
- Body: { status: string, message?: string }
```

## 🎨 React Components

### PaymentWidget
```tsx
import { PaymentButton } from '@/components/PaymentWidget';

<PaymentButton 
  orderId="order-123"
  totalAmount={150000}
  onSuccess={() => console.log('Payment initiated')}
/>
```

### Invoice Display
```tsx
import { Invoice } from '@/components/Invoice';

<Invoice
  orderId="order-123"
  trackingId="ABC123"
  customerName="John Doe"
  customerEmail="john@example.com"
  customerPhone="08123456789"
  items={[...]}
  subtotal={100000}
  logisticsCost={50000}
  discountPercentage={35}
  total={150000}
  status="CONFIRMED"
  paymentStatus="SUCCESS"
/>
```

### ProductManager (Admin)
```tsx
import { ProductManager } from '@/components/ProductManager';

<ProductManager
  productId="prod-123"
  productName="Tomat Segar"
  currentPrice={15000}
  currentImageUrl="/uploads/products/..."
  onSuccess={() => refetchProduct()}
/>
```

### AdminOrdersDashboard
```tsx
import { AdminOrdersDashboard } from '@/components/AdminOrdersDashboard';

<AdminOrdersDashboard
  onOrderSelect={(orderId) => navigateTo(`/admin/orders/${orderId}`)}
/>
```

## 🔄 React Hooks

### usePayment
```tsx
const { loading, error, initiatePayment } = usePayment();

const result = await initiatePayment(orderId);
if (result.ok) {
  window.location.href = result.data.url;
}
```

### useProductManagement
```tsx
const { loading, error, uploadImage, updatePricing, getImages } = useProductManagement();

await uploadImage(productId, file);
await updatePricing(productId, 15000);
const images = await getImages(productId);
```

### useAdminOrders
```tsx
const { orders, pagination, loading, error, fetchOrders, updateOrderStatus, getOrderDetail } = useAdminOrders();

await fetchOrders('PENDING', 1);
await updateOrderStatus(orderId, 'PROCESSING', 'Sedang dikemas');
const detail = await getOrderDetail(orderId);
```

## 📱 Frontend Integration Points

### Di Katalog Detail (Info Tani Page)
1. Show product image dari `/api/products/{id}/images`
2. Show harga per kg
3. **Add PaymentButton component** untuk start checkout
4. Tampilkan invoice setelah pembayaran sukses

### Di Admin Dashboard (`/admin/orders`)
1. **Gunakan AdminOrdersDashboard** untuk list orders
2. Filter by status, update status inline
3. Click "Lihat Detail" untuk order detail page
4. Show payment status & customer messages

### Di Admin Products (`/admin/products`)
1. **Gunakan ProductManager** untuk setiap produk
2. Upload gambar
3. Update harga per kg

## 🔐 Database Schema Updates

New models created:
```prisma
model ProductImage {
  id        String
  productId String
  imageUrl  String
  isPrimary Boolean
  product   Product
}

model Payment {
  id                      String
  orderId                 String (UNIQUE)
  amount                  Decimal
  method                  PaymentMethod (CREDIT_CARD, BANK_TRANSFER, QRIS, E_WALLET)
  status                  PaymentStatus (PENDING, SUCCESS, FAILED, CANCELLED)
  midtransTransactionId   String?
  midtransUrl             String?
  paidAt                  DateTime?
}

model OrderMessage {
  id        String
  orderId   String
  sender    String ('ADMIN', 'FARMER', 'SYSTEM')
  message   String
  status    String ('UNREAD', 'READ')
  order     Order
}
```

## 🚀 Workflow: End-to-End Order & Payment

1. **Customer Browse Catalog**
   - View product dengan image & harga per kg
   - Tambah ke cart & checkout

2. **Create Order**
   - POST `/api/orders` dengan items, logistics, delivery method
   - Get orderId & trackingId

3. **Initiate Payment**
   - Click "Bayar Sekarang" button
   - POST `/api/orders/{orderId}/payment`
   - Redirect ke Midtrans payment page

4. **Payment Processing**
   - Midtrans handles payment
   - On success, webhook POST `/api/webhooks/payment`
   - Order status updated to CONFIRMED
   - Notification message created for farmer

5. **Show Invoice**
   - Display Invoice component dengan status SUCCESS
   - Customer dapat print atau simpan

6. **Admin Monitor**
   - Admin buka `/admin/orders`
   - Lihat order list dengan filter status
   - Update status: PROCESSING → SHIPPED → DELIVERED
   - Add message untuk setiap update

7. **Customer Tracking**
   - GET `/api/tracking/{trackingId}` untuk tracking points
   - Real-time location updates

## ⚙️ Configuration Checklist

- [ ] Add Midtrans keys to `.env`
- [ ] Run `npm run db:seed` (if needed)
- [ ] Create `/public/uploads/products/` directory (auto-created on first upload)
- [ ] Update catalog detail page to use PaymentButton
- [ ] Create admin orders page with AdminOrdersDashboard
- [ ] Create admin products page with ProductManager
- [ ] Add invoice display page after checkout
- [ ] Setup Midtrans webhook URL in dashboard: `https://yourdomain.com/api/webhooks/payment`

## 🐛 Troubleshooting

### Payment not working
- Check Midtrans keys in `.env`
- Verify webhook URL is accessible
- Check browser console for errors

### Image upload fails
- Check `/public/uploads/products/` directory exists and writable
- File must be JPG, PNG, or WebP
- File size max 5MB

### Order not appearing in admin
- Verify logged-in user is FARMER (farmerId must match)
- Check database has order with correct farmerId

## 📝 Next Steps (Optional Enhancements)

1. **Multi-vehicle persistence**: Store multiple logistics vehicles per order
2. **Real-time notification**: WebSocket for live order updates
3. **Payment receipt email**: Auto-send invoice to customer email
4. **Advanced tracking**: Google Maps integration for tracking view
5. **Refund handling**: API untuk process refund via Midtrans
6. **Order export**: CSV/PDF export untuk admin reporting
