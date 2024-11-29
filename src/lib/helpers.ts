// src/lib/helpers.ts
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

export function generateOrderId(): string {
  return `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

export function getOrderStatus(status: string): {
  label: string;
  color: string;
} {
  const statuses = {
    pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    processing: { label: 'Processing', color: 'bg-blue-100 text-blue-800' },
    shipped: { label: 'Shipped', color: 'bg-green-100 text-green-800' },
    delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800' },
    cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800' }
  };
  return statuses[status as keyof typeof statuses] || statuses.pending;
}