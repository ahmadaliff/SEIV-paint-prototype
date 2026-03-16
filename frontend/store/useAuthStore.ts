import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Medusa from '@medusajs/medusa-js';
import { medusaApi, setAuthToken, getApiErrorMessage } from '@/lib/api';
import { useProductStore } from './useProductStore';
import { useCartStore } from './useCartStore';

export type Role =
  | 'INDIVIDUAL'
  | 'DISTRIBUTOR_BRONZE'
  | 'DISTRIBUTOR_SILVER'
  | 'DISTRIBUTOR_GOLD'
  | 'ADMIN';

export interface User {
  id: string;
  email?: string;
  name: string;
  role: Role;
  lat: number;
  lng: number;
  customerGroupId?: string;
}

export interface Customer {
  id: string
  email: string
  company_name: string | null
  first_name: string
  last_name: string
  phone: string | null,
  metadata: string | null,
  has_account: boolean,
  deleted_at: string | null,
  created_at: string | null,
  updated_at: string | null,
  addresses: [],
  groups?: { id: string; name: string }[]
}
interface AuthState {
  user: User | null;
  role: Role;
  minPurchaseRequired: number;

  setRole: (role: Role) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loginAsRole: (role: Role) => Promise<void>;
}

const medusa = new Medusa({
  baseUrl: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000',
  maxRetries: 3,
  publishableApiKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
});

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      role: 'INDIVIDUAL',
      minPurchaseRequired: 0,

      setRole: (role) => {
        const minPurchase = role.startsWith('DISTRIBUTOR') ? 1000000 : 0;
        set({ role, minPurchaseRequired: minPurchase });
        useProductStore.getState().fetchProducts();
      },

      login: async (email, password) => {
        try {
          const { data: loginData } = await medusaApi.post('/auth/customer/emailpass', { email, password });
          const token = loginData.token || loginData.access_token;
          if (token) setAuthToken(token);
          const { data: customerData } = await medusaApi.get('/store/customers/me');
          const customer = customerData.customer;

          if (customer) {
            let role: Role = (customer.metadata?.role as Role) || 'INDIVIDUAL';
            console.log('[Auth] Login Success. Detected Role:', role);
            console.log('[Auth] Customer Metadata:', customer.metadata);

            set({
              user: {
                id: customer.id,
                name: `${customer.first_name} ${customer.last_name}`,
                role,
                lat: 0,
                lng: 0,
                email: customer.email,
              },
              role,
            });

            useProductStore.getState().fetchProducts();
            const cartId = useCartStore.getState().cartId;
            if (cartId) {
              try {
                await medusa.carts.update(cartId, {
                  customer_id: customer.id,
                  email: customer.email,
                });
              } catch (err) {
                console.warn('[Auth] Could not attach customer to cart:', err);
              }
            }
          }
        } catch (error) {
          console.error('[Auth] Login error:', error);
          throw new Error(getApiErrorMessage(error, 'Login gagal.'));
        }
      },

      logout: async () => {
        try {
          await medusaApi.delete('/auth/session');
        } catch (err) {
          console.warn('[Auth] Logout request failed:', err);
        } finally {
          setAuthToken(null);
          set({ user: null, role: 'INDIVIDUAL', minPurchaseRequired: 0 });
          useCartStore.getState().clearCart();
        }
      },

      loginAsRole: async (role: Role) => {
        const credentials: Record<string, string> = {
          INDIVIDUAL: 'individual@seiv.com',
          DISTRIBUTOR_BRONZE: 'distributorbronze@seiv.com',
          DISTRIBUTOR_SILVER: 'distributorsilver@seiv.com',
          DISTRIBUTOR_GOLD: 'distributorgold@seiv.com',
          ADMIN: 'admin@seiv.com',
        };

        const email = credentials[role];
        const demoPassword = 'Supersecret123!';
        
        console.log(`[Demo] Attempting real login for ${role} (${email})...`);
        
        try {
          if (role === 'ADMIN') {
            const { data } = await medusaApi.post('/auth/user/emailpass', {
              email,
              password: demoPassword,
            });
            
            console.log('[Demo Admin] Login response data:', data);
            
            const adminToken = data.token || data.access_token;
            if (adminToken) {
                console.log('[Demo Admin] Found token:', adminToken.slice(0, 10) + '...');
                setAuthToken(adminToken);
            } else {
                console.warn('[Demo Admin] No token found in response!', data);
            }
            
            set({ user: { id: 'admin_demo', name: 'SEIV Admin', role: 'ADMIN', lat: 0, lng: 0, email }, role: 'ADMIN' });
          } else {
            // Panggil fungsi login asli, jangan cuma setRole
            await get().login(email, demoPassword);
          }
          console.log(`[Demo] SUCCESS: Now logged in as ${role}`);
        } catch (e) {
          console.error(`[Demo] CRITICAL: Real login for ${role} FAILED:`, e);
          alert(`Login demo gagal untuk ${role}. Pastikan database sudah di-seed.`);
        }
      },
    }),
    {
      name: 'seiv-auth-storage',
      partialize: (state) => ({ user: state.user, role: state.role }),
    }
  )
);
