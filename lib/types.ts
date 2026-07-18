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
