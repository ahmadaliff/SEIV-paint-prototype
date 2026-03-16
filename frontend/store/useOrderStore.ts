import { create } from 'zustand';
import Medusa from '@medusajs/medusa-js';
import { medusaApi } from '@/lib/api';
import { Order } from '@/lib/types';

interface OrderState {
  orders: Order[];
  totalUsers: number;
  isLoadingOrders: boolean;

  fetchOrders: () => Promise<void>;
  fetchCustomers: () => Promise<void>;
}

const medusa = new Medusa({
  baseUrl: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000',
  maxRetries: 3,
  publishableApiKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
});

export const useOrderStore = create<OrderState>()((set) => ({
  orders: [],
  totalUsers: 0,
  isLoadingOrders: false,

  fetchOrders: async () => {
    set({ isLoadingOrders: true });
    try {
      console.log('[OrderStore] Fetching orders. Auth Header:', medusaApi.defaults.headers.common['Authorization']);
      // Use medusaApi directly for better control of headers (admin token is set there)
      const { data } = await medusaApi.get('/admin/orders');
      const medusaOrders = data.orders || [];

      const mappedOrders: Order[] = medusaOrders.map((o: any) => ({
        id: o.display_id ? `ORD-${o.display_id}` : (o.id?.slice(-8).toUpperCase() || 'ORD-UNKNOWN'),
        customer: `${o.customer?.first_name || ''} ${o.customer?.last_name || ''}`.trim() || o.email || 'Guest',
        status: o.status === 'completed' ? 'Success' : o.status.charAt(0).toUpperCase() + o.status.slice(1),
        statusColor:
          o.status === 'completed'
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-blue-100 text-blue-700',
        total: (o.total || o.amount || 0) / 100,
        date: new Date(o.created_at).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        items: (o.items || []).map((item: any) => ({
          productId: item.variant?.product_id,
          name: item.title,
          price: (item.unit_price || 0) / 100,
          quantity: item.quantity,
          image: item.thumbnail || '/placeholder-paint.png',
        })),
      }));

      set({ orders: mappedOrders });
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      set({ isLoadingOrders: false });
    }
  },

  fetchCustomers: async () => {
    try {
      const { data } = await medusaApi.get('/admin/customers');
      set({ totalUsers: data.count || data.customers?.length || 0 });
    } catch (error) {
      console.error('Error fetching customers:', error);
      // Fallback if not admin
      set({ totalUsers: 0 });
    }
  }
}));
