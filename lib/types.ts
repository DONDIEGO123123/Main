export type Category = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compare_at_price: number | null;
  image_url: string | null;
  gallery: string[];
  videos?: string[] | null;
  category_id: string | null;
  is_featured: boolean;
  is_active: boolean;
  stock: number;
  views: number;
  created_at: string;
};

export type Promotion = {
  id: string;
  title: string;
  subtitle: string;
  image_url: string | null;
  cta_label: string;
  cta_url: string;
  is_active: boolean;
  sort_order: number;
};

export type Banner = {
  id: string;
  headline: string;
  subheadline: string;
  image_url: string | null;
  cta_label: string;
  cta_url: string;
  is_active: boolean;
  sort_order: number;
};

export type Review = {
  id: string;
  author: string;
  rating: number;
  content: string;
  is_approved: boolean;
  created_at: string;
};

export type DeliveryArea = {
  id: string;
  region: string;
  name: string;
  eta: string;
  fee: number;
  is_active: boolean;
};

export type Faq = {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
};

export type CartItem = {
  product_id: string;
  name: string;
  price: number;
  image_url: string | null;
  qty: number;
};

export type Order = {
  id: string;
  order_number: number;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  city: string;
  region: string | null;
  notes: string;
  items: CartItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: "new" | "confirmed" | "shipped" | "delivered" | "cancelled";
  referral_code: string | null;
  tracking_number?: string | null;
  courier?: string | null;
  admin_notes?: string | null;
  channel?: string | null;
  created_at: string;
};

export type SiteSettings = {
  name?: string;
  tagline?: string;
  telegram?: string;
  whatsapp?: string;
  music_url?: string;
  // Deal of the Day
  deal_enabled?: boolean;
  deal_product_id?: string;
  deal_price?: number;
  deal_ends_at?: string;
  // VIP / funnel toggles
  vip_enabled?: boolean;
  vip_telegram?: string;
  wizard_enabled?: boolean;
  referral_enabled?: boolean;
  referral_reward?: string;
  // "why us" configurable text
  why_title?: string;
  why_items?: { icon: string; title: string; text: string }[];
};
