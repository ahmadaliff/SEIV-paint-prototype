import { create } from 'zustand';
import { Product } from '@/lib/types';
import { medusaApi } from '@/lib/api';
import { useAuthStore } from './useAuthStore';

interface ProductState {
  products: Product[];
  isLoadingProducts: boolean;
  regions: any[];
  selectedRegionId: string | null;

  fetchProducts: () => Promise<void>;
  fetchRegions: () => Promise<void>;
}

export const useProductStore = create<ProductState>()((set, get) => ({
  products: [],
  isLoadingProducts: false,
  regions: [],
  selectedRegionId: null,

  fetchRegions: async () => {
    try {
      const { data } = await medusaApi.get('/store/regions');
      const regions = data.regions || [];
      set({ regions, selectedRegionId: regions[0]?.id || null });
    } catch (error) {
      console.error('[Store] Error fetching regions:', error);
    }
  },

  fetchProducts: async () => {
    set({ isLoadingProducts: true });
    try {
      // Ensure we have a region ID
      let regionId = get().selectedRegionId;
      if (!regionId) {
        await get().fetchRegions();
        regionId = get().selectedRegionId;
      }

      const { data } = await medusaApi.get('/store/products', {
        params: {
          fields: "id,title,thumbnail,handle,description,categories.name,options.title,options.values,*variants.prices,*variants.calculated_price,variants.options,variants.title,variants.sku,variants.manage_inventory,variants.allow_backorder,variants.inventory_quantity",
          region_id: regionId
        }
      });
      const fetchedProducts = data.products;

      if (fetchedProducts && fetchedProducts.length > 0) {
        const currentRole = useAuthStore.getState().role;

        const mappedProducts: Product[] = fetchedProducts.map((p: any) => {
          const variants = (p.variants || []).map((v: any) => {
            const calculatedPrice = v.calculated_price;
            const prices = v.prices || [];
            
            // Use calculated price if available (it applies the best discount automatically)
            const unitPrice = calculatedPrice ? calculatedPrice.calculated_amount : (prices.find((pr: any) => pr.currency_code === 'idr' && !pr.price_list_id)?.amount || 0);
            
            // For original price, find the base price without price list
            const basePriceObj = prices.find((pr: any) => 
               pr.currency_code === 'idr' && !pr.price_list_id && !pr.price_list?.id
            );
            const originalPrice = calculatedPrice ? calculatedPrice.original_amount : (basePriceObj ? basePriceObj.amount : unitPrice);
            
            // Transform options array into a Record<string, string>
            const optionsRecord: Record<string, string> = {};
            if (Array.isArray(v.options)) {
              v.options.forEach((opt: any) => {
                const optTitle = opt.option?.title || '';
                if (optTitle) {
                  optionsRecord[optTitle] = opt.value;
                }
              });
            }

            return {
              id: v.id,
              title: v.title,
              sku: v.sku,
              price: Math.round(unitPrice),
              original_price: basePriceObj ? Math.round(basePriceObj.amount) : Math.round(unitPrice),
              options: optionsRecord,
              inventory_quantity: v.inventory_quantity ?? 0,
              manage_inventory: !!v.manage_inventory,
            };
          });

          const templateImage = "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=500&auto=format&fit=crop";

          return {
            id: p.id,
            variantId: variants[0]?.id || '',
            name: p.title,
            price: variants[0]?.price || 0,
            category: p.categories?.[0]?.name || 'Cat Tembok',
            description: p.description || 'Produk SEIV Paint berkualitas tinggi untuk kebutuhan Anda.',
            image: p.thumbnail || templateImage,
            rating: Number((4.5 + Math.random() * 0.5).toFixed(1)),
            sold: Math.floor(Math.random() * 1000),
            options: p.options || [],
            variants: variants,
          };
        });

        set({ products: mappedProducts });
      } else {
        set({ products: [] });
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      set({ products: [] });
    } finally {
      set({ isLoadingProducts: false });
    }
  },
}));
