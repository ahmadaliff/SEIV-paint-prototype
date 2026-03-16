export interface Branch {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export interface ProductOption {
  id: string;
  title: string;
  values: string[];
}

export interface ProductVariant {
  id: string;
  title: string;
  sku: string;
  price: number;
  original_price?: number;
  options: Record<string, string>;
  inventory_quantity?: number;
  manage_inventory?: boolean;
}

export interface Product {
  id: string;
  variantId: string;
  name: string;
  price: number; // base price (starting at)
  category: string;
  description: string;
  image: string;
  rating: number;
  sold: number;
  options: ProductOption[];
  variants: ProductVariant[];
  metadata?: Record<string, any>;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  customer: string;
  status: 'Pending' | 'Processing' | 'Paid' | 'Shipped' | 'Completed' | 'canceled' | 'completed' | 'pending' | 'requires_action' | 'archived';
  statusColor: string;
  total: number;
  items: OrderItem[];
  date: string;
  shipping?: {
    method: string;
    branch: string;
    destination: string;
    zone: number;
    distance: number;
    cost: number;
  };
  billing?: {
    subtotal: number;
    discount: number;
    discountPercent: number;
  };
  role?: 'INDIVIDUAL' | 'DISTRIBUTOR_SILVER' | 'DISTRIBUTOR_BRONZE' | 'DISTRIBUTOR_GOLD' | 'ADMIN';
}
