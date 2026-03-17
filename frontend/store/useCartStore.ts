import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { medusaApi } from '@/lib/api';
import { useProductStore } from './useProductStore';

export interface CartItem {
  id: string;
  variantId: string;
  title: string;
  thumbnail: string | null;
  quantity: number;
  unitPrice: number;
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
    variantId: item.variant_id,
    title: item.title,
    thumbnail: item.thumbnail,
    quantity: item.quantity,
    unitPrice: item.unit_price,
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
        const { user } = (await import('./useAuthStore')).useAuthStore.getState();
        
        if (!user) {
          alert('Silakan login terlebih dahulu untuk menambah barang ke keranjang.');
          return;
        }

        if (get().isAddingToCart) return;
        set({ isAddingToCart: true });
        try {
          let currentCartId = get().cartId;
          
          // Helper to create a new cart
          const createNewCart = async () => {
             const regionId = useProductStore.getState().selectedRegionId;
             const { data } = await medusaApi.post('/store/carts', {
               region_id: regionId
             });
             set({ cartId: data.cart.id });
             return data.cart.id;
          };

          if (!currentCartId) {
            currentCartId = await createNewCart();
          }

          try {
            const { data } = await medusaApi.post(`/store/carts/${currentCartId}/line-items`, {
              variant_id: variantId,
              quantity: qty,
            });

            set({ 
                cart: mapItems(data.cart.items),
                fullCart: data.cart
            });
          } catch (error: any) {
             // If cart not found (expired), clear ID and try one more time
             if (error?.response?.status === 404) {
                console.warn("[Cart] Cart expired or not found. Creating new cart...");
                const newId = await createNewCart();
                const { data } = await medusaApi.post(`/store/carts/${newId}/line-items`, {
                  variant_id: variantId,
                  quantity: qty,
                });
                set({ 
                    cart: mapItems(data.cart.items),
                    fullCart: data.cart
                });
             } else {
                throw error;
             }
          }
        } catch (error: any) {
          const message = error.response?.data?.message || 'Stok tidak mencukupi atau terjadi kesalahan.';
          console.error("[Cart] Add to cart error:", error);
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
              // Use custom direct checkout to bypass payment requirement for prototype
              const { data } = await medusaApi.post(`/store/checkout-direct`, {
                  cart_id: cartId
              });
              
              if (data.type === 'order' || data.success) {
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
