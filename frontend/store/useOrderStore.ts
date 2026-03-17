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
  updateOrderStatus: (realId: string, status: string) => Promise<void>;
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
      // In Medusa v2, specify fields to get nested customer, order metadata, payment and fulfillment status
      const { data } = await medusaApi.get('/admin/orders?fields=id,display_id,created_at,total,status,payment_status,fulfillment_status,email,metadata,+customer,+customer.metadata,+items,+items.metadata,+items.variant');
      const medusaOrders = data.orders || [];

      const mappedOrders: Order[] = medusaOrders.map((o: any) => {
        const billing = o.metadata?.billing_summary || {};
        const customerRole = billing.customer_role || o.customer?.metadata?.role || 'INDIVIDUAL';

        let displayStatus = o.status.charAt(0).toUpperCase() + o.status.slice(1);
        if (o.metadata?.custom_status) {
          displayStatus = o.metadata.custom_status;
        } else if (o.status === 'requires_action') {
          displayStatus = 'Processing';
        } else if (o.payment_status === 'captured') {
          displayStatus = 'Paid';
        } else if (o.fulfillment_status === 'shipped') {
          displayStatus = 'Shipped';
        } else if (o.status === 'completed') {
          displayStatus = 'Completed';
        }

        return {
          id: o.display_id ? `ORD-${o.display_id}` : (o.id?.slice(-8).toUpperCase() || 'ORD-UNKNOWN'),
          realId: o.id,
          customer: `${o.customer?.first_name || ''} ${o.customer?.last_name || ''}`.trim() || o.email || 'Guest',
          status: displayStatus as any,
          statusColor:
            displayStatus === 'Completed' || displayStatus === 'Success'
              ? 'bg-emerald-100 text-emerald-700'
              : displayStatus === 'Shipped'
                ? 'bg-purple-100 text-purple-700'
                : displayStatus === 'Processing'
                  ? 'bg-amber-100 text-amber-700'
                  : displayStatus === 'Paid'
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-blue-100 text-blue-700',
          total: (o.total || 0),
          date: new Date(o.created_at).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
          role: customerRole,
          billing: {
            subtotal: billing.subtotal || (o.total || 0),
            discount: billing.discount_total || 0,
            discountPercent: billing.discount_percent || 0
          },
          items: (o.items || []).map((item: any) => ({
            productId: item.variant?.product_id,
            name: item.title,
            price: item.unit_price || 0,
            quantity: item.quantity,
            image: item.thumbnail || '/placeholder-paint.png',
            discountInfo: item.metadata?.discount_applied ? `Diskon ${customerRole.replace('_', ' ')} ${item.metadata.discount_applied} applied` : '',
            originalPrice: item.metadata?.original_price || (item.unit_price || 0)
          })),
        };
      });

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
  },

  updateOrderStatus: async (realId: string, status: string) => {
    try {
      await medusaApi.post(`/admin/order-update/${realId}`, {
        status: status
      });

      console.log(`[OrderStore] Backend updated status to ${status} for ${realId}`);
      const state = useOrderStore.getState();
      await state.fetchOrders();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Gagal update status di backend');
    }
  }
}));
