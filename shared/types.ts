export type Deal = {
  id: string;
  source: string;
  source_id: string;
  title: string;
  description: string | null;
  category: string | null;
  price: number | null;
  currency: string | null;
  link_url: string;
  image_url: string | null;
  score: number | null;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
};
