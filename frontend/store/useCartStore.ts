import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { medusaApi } from '@/lib/api';
import { useProductStore } from './useProductStore';

export interface CartItem {
  id: string;
  productId: string; // stores variant_id
  quantity: number;
}

interface CartState {
  cart: CartItem[];
  cartId: string | null;
  fullCart: any | null;
  isAddingToCart: boolean;
  isLoadingCart: boolean;

  // Actions
  addToCart: (variantId: string, quantity?: number) => Promise<void>;
  removeFromCart: (lineItemId: string) => Promise<void>;
  updateCartItemQuantity: (lineItemId: string, quantity: number) => Promise<void>;
  fetchCart: () => Promise<void>;
  updateCartDetails: (details: any) => Promise<void>;
  setShippingMethod: (optionId: string) => Promise<void>;
  placeOrder: () => Promise<any>;
  clearCart: () => void;
}

function mapItems(items: any[]): CartItem[] {
  if (!items) return [];
  return items.map((item) => ({
    id: item.id,
    productId: item.variant_id,
    quantity: item.quantity,
  }));
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: [],
      cartId: null,
      fullCart: null,
      isAddingToCart: false,
      isLoadingCart: false,

      clearCart: () => set({ cart: [], cartId: null, fullCart: null }),

      addToCart: async (variantId, qty = 1) => {
        if (get().isAddingToCart) return;
        set({ isAddingToCart: true });
        try {
          let currentCartId = get().cartId;
          if (!currentCartId) {
            const { data } = await medusaApi.post('/store/carts');
            currentCartId = data.cart.id;
            set({ cartId: currentCartId });
          }

          const { data } = await medusaApi.post(`/store/carts/${currentCartId}/line-items`, {
            variant_id: variantId,
            quantity: qty,
          });

          set({ 
              cart: mapItems(data.cart.items),
              fullCart: data.cart
          });
        } catch (error: any) {
          const message = error.response?.data?.message || 'Stok tidak mencukupi atau terjadi kesalahan.';
          alert(message);
          throw error;
        } finally {
          set({ isAddingToCart: false });
        }
      },

      removeFromCart: async (lineItemId) => {
        const cartId = get().cartId;
        if (!cartId) return;
        try {
          const { data } = await medusaApi.delete(`/store/carts/${cartId}/line-items/${lineItemId}`);
          set({ 
              cart: mapItems(data.cart.items),
              fullCart: data.cart
          });
        } catch (error) {
          console.error('Error removing from cart:', error);
        }
      },

      updateCartItemQuantity: async (lineItemId, quantity) => {
        const cartId = get().cartId;
        if (!cartId || quantity < 1) return;
        try {
          const { data } = await medusaApi.post(`/store/carts/${cartId}/line-items/${lineItemId}`, { quantity });
          set({ 
              cart: mapItems(data.cart.items),
              fullCart: data.cart 
          });
        } catch (error: any) {
          const message = error.response?.data?.message || 'Stok tidak mencukupi atau terjadi kesalahan.';
          alert(message);
        }
      },

      fetchCart: async () => {
        const cartId = get().cartId;
        if (!cartId) return;
        set({ isLoadingCart: true });
        
        try {
          const { data } = await medusaApi.get(`/store/carts/${cartId}`);
          if (data.cart) {
            set({ 
                cart: mapItems(data.cart.items),
                fullCart: data.cart
            });
          }
        } catch (error: any) {
          console.error('Error fetching cart:', error);
          if (error?.response?.status === 404) set({ cartId: null, cart: [], fullCart: null });
        } finally {
          set({ isLoadingCart: false });
        }
      },

      updateCartDetails: async (details) => {
          const cartId = get().cartId;
          if (!cartId) return;
          
          try {
              const { data } = await medusaApi.post(`/store/carts/${cartId}`, details);
              set({ fullCart: data.cart });
          } catch (error) {
              console.error('Error updating cart details:', error);
              throw error;
          }
      },

      setShippingMethod: async (optionId) => {
          const cartId = get().cartId;
          if (!cartId) return;
          try {
              const { data } = await medusaApi.post(`/store/carts/${cartId}/shipping-methods`, {
                  option_id: optionId
              });
              set({ fullCart: data.cart });
          } catch (error) {
              console.error('Error setting shipping method:', error);
              throw error;
          }
      },

      placeOrder: async () => {
          const cartId = get().cartId;
          if (!cartId) return;
          try {
              // 1. Create Payment Sessions
              await medusaApi.post(`/store/carts/${cartId}/payment-sessions`);
              
              // 2. Complete Cart
              const { data } = await medusaApi.post(`/store/carts/${cartId}/complete`);
              
              if (data.type === 'order') {
                  get().clearCart();
                  return data.data; // The order object
              }
              throw new Error("Gagal menyelesaikan checkout.");
          } catch (error) {
              console.error('Error placing order:', error);
              throw error;
          }
      }
    }),
    {
      name: 'seiv-cart-storage',
      partialize: (state) => ({ cartId: state.cartId }),
    }
  )
);
