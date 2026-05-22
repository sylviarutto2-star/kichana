// Loose hand-rolled types — practical without code generation.
export type UUID = string;
export type ISO = string;

export type Profile = {
  id: UUID;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: "customer" | "stylist";
  neighborhood: string | null;
  language: "en" | "sw";
  loyalty_points: number;
  hair_type: string | null;
  allergies: string | null;
  birthday: string | null;
  onboarding_complete: boolean;
  waitlisted_at: ISO | null;
  created_at: ISO;
};

export type Stylist = {
  id: UUID;
  profile_id: UUID;
  display_name: string;
  bio: string | null;
  hero_image_url: string | null;
  specialties: string[];
  neighborhoods: string[];
  base_location: string | null;
  travels: boolean;
  rating_avg: number;
  rating_count: number;
  bookings_count: number;
  verified: boolean;
  lat?: number | null;
  lng?: number | null;
  featured_until: ISO | null;
  commission_rate: number;
  loyalty_tier: "bronze" | "silver" | "gold" | "platinum";
  created_at: ISO;
};

export type Service = {
  id: UUID;
  stylist_id: UUID;
  category: string;
  title: string;
  description: string | null;
  duration_min: number;
  price_kes: number;
  cover_url: string | null;
  active: boolean;
};

export type FeedPost = {
  id: UUID;
  author_id: UUID;
  stylist_id: UUID | null;
  booking_id: UUID | null;
  image_url: string;
  caption: string | null;
  category: string | null;
  likes_count: number;
  comments_count: number;
  expires_at: ISO;
  created_at: ISO;
};

// Loose database type lets queries flow without code-gen.
export type Database = any;
