export type Role = 'customer' | 'employee' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  createdAt: string;
}

export interface Address {
  id: string;
  userId?: string;
  title: string;
  postalCode: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  referencePoint?: string;
  isDefault?: boolean;
}

export interface ProductAddon {
  id: string;
  name: string;
  description: string;
  price: number;
  checked?: boolean;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  price: number;
  promotionalPrice?: number;
  unitLabel: string;
  weightGrams?: number;
  badgeTag?: string;
  isAvailable: boolean;
  isFeatured?: boolean;
  isGlutenFree?: boolean;
  isLactoseFree?: boolean;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  addons?: ProductAddon[];
  stockAvailable?: number;
}

export interface Category {
  id: string;
  name: string;
  iconName: string;
  count: number;
}

export interface CartItemAddon {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  id: string; // unique item instance id
  productId: string;
  name: string;
  unitLabel: string;
  unitPrice: number;
  quantity: number;
  imageUrl: string;
  badgeTag?: string;
  addons: CartItemAddon[];
  notes?: string;
  itemTotal: number;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface OrderStatusHistoryItem {
  status: OrderStatus;
  label: string;
  description: string;
  timestamp: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

export interface Order {
  id: string;
  orderNumber: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  status: OrderStatus;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  paymentMethod: 'pix' | 'credit' | 'debit' | 'cash';
  paymentStatus: 'pending' | 'approved' | 'rejected';
  address: Address;
  courier?: {
    name: string;
    phone: string;
    avatarUrl: string;
    rating: number;
    deliveriesCount: number;
  };
  notes?: string;
  includeEcoUtensils: boolean;
  estimatedDeliveryTime: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoreSettings {
  storeName: string;
  slogan: string;
  cnpj: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  address: string;
  openingHours: string;
  closedDays: string;
  baseDeliveryFee: number;
  freeShippingThreshold: number;
  pixKey: string;
  pixDiscountPercent: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  ordersCount: number;
  totalSpent: number;
  isActive: boolean;
  createdAt: string;
}
