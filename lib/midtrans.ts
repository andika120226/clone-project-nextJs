import midtransClient from 'midtrans-client';

const snap = new midtransClient.Snap({
  isProduction: false, // Set to true in production
  serverKey: process.env.MIDTRANS_SERVER_KEY || '',
  clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
});

export interface SnapTransactionParams {
  transaction_details: {
    order_id: string;
    gross_amount: number;
  };
  customer_details: {
    first_name: string;
    email: string;
    phone: string;
  };
  item_details?: Array<{
    id: string;
    price: number;
    quantity: number;
    name: string;
  }>;
  callbacks?: {
    finish: string;
    error: string;
    pending: string;
  };
}

export async function createSnapTransaction(params: SnapTransactionParams): Promise<string> {
  try {
    const transaction = await snap.createTransaction(params);
    return transaction.token;
  } catch (error) {
    console.error('Midtrans error:', error);
    throw error;
  }
}

export async function getTransactionStatus(orderId: string) {
  try {
    const status = await snap.transaction.status(orderId);
    return status;
  } catch (error) {
    console.error('Midtrans status error:', error);
    throw error;
  }
}

export async function createTransactionAndGetUrl(
  orderId: string,
  amount: number,
  customerName: string,
  customerEmail: string,
  customerPhone: string,
  items?: Array<{ id: string; price: number; quantity: number; name: string }>
): Promise<{ token: string; url: string }> {
  const params: SnapTransactionParams = {
    transaction_details: {
      order_id: orderId,
      gross_amount: Math.round(amount),
    },
    customer_details: {
      first_name: customerName,
      email: customerEmail,
      phone: customerPhone,
    },
  };

  if (items) {
    params.item_details = items;
  }

  try {
    const transaction = await snap.createTransaction(params);
    return {
      token: transaction.token,
      url: transaction.redirect_url,
    };
  } catch (error) {
    console.error('Error creating Midtrans transaction:', error);
    throw error;
  }
}

import crypto from 'crypto';

export function verifySignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  serverKey: string,
  signature: string
): boolean {
  const data = orderId + statusCode + grossAmount + serverKey;
  const hash = crypto.createHash('sha512').update(data).digest('hex');
  return hash === signature;
}
