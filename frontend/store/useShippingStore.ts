import { create } from 'zustand';
import { medusaApi } from '@/lib/api';

export interface ShippingZone {
  id: string;
  name: string;
  description: string;
  price: number;
  active: boolean;
  medusaId?: string;
}

export interface BranchCutoff {
  id: string;
  name: string;
  cutoff: string;
}

export interface ShippingConfig {
  defaultCutoff: string;
  freeShippingThreshold: number;
  freeShippingZones: number[];
  notifications: {
    whatsapp: boolean;
    email: boolean;
  };
}

interface ShippingState {
  shippingZones: ShippingZone[];
  config: ShippingConfig;
  branchCutoffs: BranchCutoff[];
  isLoadingShipping: boolean;

  fetchShippingOptions: () => Promise<void>;
  updateShippingOption: (id: string, name: string, price: number) => void;
  updateConfig: (config: Partial<ShippingConfig>) => void;
  updateBranchCutoff: (index: number, cutoff: string) => void;
  saveAllShippingConfig: () => Promise<void>;
}

const DEFAULT_ZONES: ShippingZone[] = [
  { id: '1', name: 'Zona 1', description: '0-15 km dari Store/Pabrik', price: 15000, active: true },
  { id: '2', name: 'Zona 2', description: '0-30 km dari Store/Pabrik', price: 25000, active: true },
  { id: '3', name: 'Zona 3', description: '0-50 km dari Store/Pabrik', price: 40000, active: true },
];

export const useShippingStore = create<ShippingState>()((set, get) => ({
  shippingZones: [],
  config: {
    defaultCutoff: "12:00",
    freeShippingThreshold: 500000,
    freeShippingZones: [1, 2],
    notifications: {
      whatsapp: true,
      email: true
    }
  },
  branchCutoffs: [],
  isLoadingShipping: false,

  fetchShippingOptions: async () => {
    set({ isLoadingShipping: true });
    try {
      // Get cartId from useCartStore for storefront context
      const cartId = (await import('./useCartStore')).useCartStore.getState().cartId;
      
      let shipping_options = [];
      
      try {
        if (cartId) {
          const { data } = await medusaApi.get(`/store/shipping-options?cart_id=${cartId}`);
          shipping_options = data.shipping_options || [];
        } else {
          const { data } = await medusaApi.get('/admin/shipping-options');
          shipping_options = data.shipping_options || [];
        }
      } catch (innerErr) {
        console.warn('Attempting fallback for shipping options...');
        // Final fallback: try store even without cartId if admin fails
        try {
          const { data } = await medusaApi.get('/store/shipping-options');
          shipping_options = data.shipping_options || [];
        } catch (f) {
          console.error('All shipping fetch attempts failed.');
        }
      }

      let zones: ShippingZone[] = JSON.parse(JSON.stringify(DEFAULT_ZONES)).map((z: ShippingZone) => ({ ...z, price: 0 }));

      if (shipping_options.length > 0) {
        shipping_options.forEach((so: any) => {
          // In Medusa V2 Store API, price might be in different format
          const amount = so.amount || so.prices?.[0]?.amount || 0;
          if (so.name.includes('Zona 1')) { zones[0].price = amount; zones[0].medusaId = so.id; }
          if (so.name.includes('Zona 2')) { zones[1].price = amount; zones[1].medusaId = so.id; }
          if (so.name.includes('Zona 3')) { zones[2].price = amount; zones[2].medusaId = so.id; }
        });
      }

      // 2. Fetch Store Metadata for Config (Handle 401 gracefully)
      try {
        const { data: storeData } = await medusaApi.get('/admin/store');
        const metadata = storeData.store?.metadata || {};

        if (metadata.shipping_config) {
          set({ config: metadata.shipping_config });
        }
        if (metadata.branch_cutoffs) {
          set({ branchCutoffs: metadata.branch_cutoffs });
        }
      } catch (authErr) {
        // Silently skip admin-only metadata if unauthorized
      }

      set({ shippingZones: zones });
    } catch (error) {
      console.error('Error fetching shipping options:', error);
      set({ shippingZones: DEFAULT_ZONES });
    } finally {
      set({ isLoadingShipping: false });
    }
  },

  updateShippingOption: (id, _name, price) => {
    set((state) => ({
      shippingZones: state.shippingZones.map((z) => (z.id === id ? { ...z, price } : z)),
    }));
  },

  updateConfig: (newConfig) => {
    set((state) => ({ config: { ...state.config, ...newConfig } }));
  },

  updateBranchCutoff: (index, cutoff) => {
    set((state) => {
      const next = [...state.branchCutoffs];
      next[index] = { ...next[index], cutoff };
      return { branchCutoffs: next };
    });
  },

  saveAllShippingConfig: async () => {
    try {
      const { config, branchCutoffs, shippingZones } = get();
      
      // Save Metadata to Store
      await medusaApi.post('/admin/store', {
        metadata: {
          shipping_config: config,
          branch_cutoffs: branchCutoffs
        }
      });

      // Save Shipping Option Prices (Zona 1, 2, 3)
      // Note: This requires individual updates per shipping option in Medusa
      for (const zone of shippingZones) {
        if (zone.medusaId) {
          await medusaApi.post(`/admin/shipping-options/${zone.medusaId}`, {
            prices: [{
                currency_code: 'idr',
                amount: zone.price
            }]
          });
        }
      }
    } catch (error) {
      console.error('Error saving shipping config:', error);
      throw error;
    }
  }
}));
