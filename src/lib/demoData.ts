// Demo data shown when the live database has no stylists yet (pre-launch).
// Once real stylists onboard via /studio, queries return real rows and demo
// data is automatically hidden.
//
// Imagery policy: until real stylists upload their own photos, demo cards use
// branded gradient placeholders rather than stock images. This guarantees the
// pre-launch surface looks intentional and never misrepresents the customer
// base. The moment a real user posts content, real photos take over.
import type { Stylist, Service, FeedPost } from "./database.types";

export const demoStylists: (Stylist & { profile: { full_name: string; avatar_url: string | null }; from_kes: number })[] = [
  {
    id: "demo-1", profile_id: "demo", display_name: "Amani Braids Studio",
    bio: "Knotless, boho, and box braids specialist. 6 yrs experience. Westlands HQ.",
    hero_image_url: null,
    specialties: ["braids", "knotless", "boho"], neighborhoods: ["Westlands", "Parklands"],
    base_location: "Westlands", travels: true,
    rating_avg: 4.9, rating_count: 312, bookings_count: 1240, verified: true,
    featured_until: new Date(Date.now() + 7*86400000).toISOString(),
    commission_rate: 0.10, loyalty_tier: "gold",
    created_at: new Date().toISOString(),
    profile: { full_name: "Amani Wanjiru", avatar_url: null },
    from_kes: 2500,
  },
  {
    id: "demo-2", profile_id: "demo", display_name: "Nia Natural Hair",
    bio: "Silk press, twist-outs, and protective styling for type 4 hair. Karen.",
    hero_image_url: null,
    specialties: ["natural", "silk press", "twists"], neighborhoods: ["Karen", "Lavington"],
    base_location: "Karen", travels: false,
    rating_avg: 4.8, rating_count: 187, bookings_count: 540, verified: true,
    featured_until: null, commission_rate: 0.10, loyalty_tier: "silver",
    created_at: new Date().toISOString(),
    profile: { full_name: "Nia Mwangi", avatar_url: null },
    from_kes: 3500,
  },
  {
    id: "demo-3", profile_id: "demo", display_name: "Lulu Wigs",
    bio: "Wig installs, frontals, and HD lace. Custom colour. Kilimani salon.",
    hero_image_url: null,
    specialties: ["wigs", "color", "frontals"], neighborhoods: ["Kilimani", "Hurlingham"],
    base_location: "Kilimani", travels: true,
    rating_avg: 4.7, rating_count: 220, bookings_count: 760, verified: true,
    featured_until: null, commission_rate: 0.10, loyalty_tier: "gold",
    created_at: new Date().toISOString(),
    profile: { full_name: "Lulu Achieng", avatar_url: null },
    from_kes: 4500,
  },
  {
    id: "demo-4", profile_id: "demo", display_name: "Locs By Imani",
    bio: "Sisterlocks, microlocs, retwists. Patient, gentle, perfect partings.",
    hero_image_url: null,
    specialties: ["locs", "retwist", "microlocs"], neighborhoods: ["Lavington", "Kileleshwa"],
    base_location: "Lavington", travels: false,
    rating_avg: 5.0, rating_count: 98, bookings_count: 310, verified: true,
    featured_until: null, commission_rate: 0.10, loyalty_tier: "silver",
    created_at: new Date().toISOString(),
    profile: { full_name: "Imani Otieno", avatar_url: null },
    from_kes: 2800,
  },
  {
    id: "demo-5", profile_id: "demo", display_name: "Glow Nails Bar",
    bio: "Press-ons, gel-x, and chrome art. Walk-ins welcome.",
    hero_image_url: null,
    specialties: ["nails", "gel-x", "art"], neighborhoods: ["Westlands"],
    base_location: "Westlands", travels: false,
    rating_avg: 4.6, rating_count: 410, bookings_count: 1820, verified: true,
    featured_until: null, commission_rate: 0.10, loyalty_tier: "gold",
    created_at: new Date().toISOString(),
    profile: { full_name: "Glow Studio", avatar_url: null },
    from_kes: 1500,
  },
  {
    id: "demo-6", profile_id: "demo", display_name: "Kev Cuts",
    bio: "Fades, line-ups, beard sculpting. South B barbershop.",
    hero_image_url: null,
    specialties: ["barber", "fades", "beard"], neighborhoods: ["South B", "South C"],
    base_location: "South B", travels: true,
    rating_avg: 4.8, rating_count: 156, bookings_count: 980, verified: true,
    featured_until: null, commission_rate: 0.10, loyalty_tier: "silver",
    created_at: new Date().toISOString(),
    profile: { full_name: "Kevin Ouma", avatar_url: null },
    from_kes: 800,
  },
];

export const demoServices: Record<string, Service[]> = {
  "demo-1": [
    { id: "demo-1-s1", stylist_id: "demo-1", category: "braids", title: "Knotless Braids — Medium", description: "Lightweight knotless, mid-back length. ~5 hours.", duration_min: 300, price_kes: 4500, cover_url: null, active: true },
    { id: "demo-1-s2", stylist_id: "demo-1", category: "braids", title: "Boho Braids", description: "With curly extensions. ~6 hours.", duration_min: 360, price_kes: 6500, cover_url: null, active: true },
    { id: "demo-1-s3", stylist_id: "demo-1", category: "braids", title: "Box Braids — Small", description: "Mid-back. ~7 hours.", duration_min: 420, price_kes: 5500, cover_url: null, active: true },
  ],
  "demo-2": [
    { id: "demo-2-s1", stylist_id: "demo-2", category: "natural", title: "Silk Press", description: "Wash, blow-dry, flat iron.", duration_min: 120, price_kes: 3500, cover_url: null, active: true },
    { id: "demo-2-s2", stylist_id: "demo-2", category: "natural", title: "Mini Twists", description: "Two-strand twists, all-over.", duration_min: 240, price_kes: 4500, cover_url: null, active: true },
  ],
  "demo-3": [
    { id: "demo-3-s1", stylist_id: "demo-3", category: "wigs", title: "Wig Install — HD Lace", description: "Glueless install with lay.", duration_min: 90, price_kes: 4500, cover_url: null, active: true },
    { id: "demo-3-s2", stylist_id: "demo-3", category: "color", title: "Custom Wig Colour", description: "Hand-painted highlights.", duration_min: 240, price_kes: 12000, cover_url: null, active: true },
  ],
  "demo-4": [
    { id: "demo-4-s1", stylist_id: "demo-4", category: "locs", title: "Retwist", description: "Roots only, palm rolled.", duration_min: 90, price_kes: 2800, cover_url: null, active: true },
    { id: "demo-4-s2", stylist_id: "demo-4", category: "locs", title: "Microloc Starter", description: "Initial install, full head.", duration_min: 480, price_kes: 22000, cover_url: null, active: true },
  ],
  "demo-5": [
    { id: "demo-5-s1", stylist_id: "demo-5", category: "nails", title: "Gel-X Full Set", description: "Length and shape included.", duration_min: 90, price_kes: 2500, cover_url: null, active: true },
    { id: "demo-5-s2", stylist_id: "demo-5", category: "nails", title: "Press-On Custom", description: "Custom designs.", duration_min: 60, price_kes: 1500, cover_url: null, active: true },
  ],
  "demo-6": [
    { id: "demo-6-s1", stylist_id: "demo-6", category: "barber", title: "Fade + Line Up", description: "Skin or taper fade, beard trim.", duration_min: 45, price_kes: 800, cover_url: null, active: true },
    { id: "demo-6-s2", stylist_id: "demo-6", category: "barber", title: "Home Visit Cut", description: "We come to you.", duration_min: 60, price_kes: 1500, cover_url: null, active: true },
  ],
};

// Feed posts: gradient SVGs as data URIs, branded by category. Replaced
// automatically as soon as real users post to /post.
const gradientSvg = (a: string, b: string, label: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 500'>
      <defs>
        <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0' stop-color='${a}'/>
          <stop offset='1' stop-color='${b}'/>
        </linearGradient>
      </defs>
      <rect width='400' height='500' fill='url(#g)'/>
      <circle cx='320' cy='110' r='110' fill='white' fill-opacity='0.15'/>
      <circle cx='80' cy='420' r='130' fill='white' fill-opacity='0.10'/>
      <text x='30' y='460' font-family='Georgia, serif' font-size='34' fill='#FBF6EE' font-style='italic'>${label}</text>
    </svg>`
  )}`;

export const demoFeed: (FeedPost & { author_name: string; stylist_name?: string; avatar_url?: string })[] = [
  { id: "demo-f1", author_id: "demo", stylist_id: "demo-1", booking_id: null,
    image_url: gradientSvg("#823C20", "#3F2233", "Knotless braids"),
    caption: "Knotless braids did me right ✨", category: "braids",
    likes_count: 142, comments_count: 18,
    expires_at: new Date(Date.now()+90*86400000).toISOString(),
    created_at: new Date(Date.now()-3600000).toISOString(),
    author_name: "Wanjiku K.", stylist_name: "Amani Braids Studio",
    avatar_url: undefined,
  },
  { id: "demo-f2", author_id: "demo", stylist_id: "demo-3", booking_id: null,
    image_url: gradientSvg("#A8512E", "#BC8A38", "Wig install"),
    caption: "Wig install for the wedding 🎀", category: "wigs",
    likes_count: 98, comments_count: 12,
    expires_at: new Date(Date.now()+90*86400000).toISOString(),
    created_at: new Date(Date.now()-7200000).toISOString(),
    author_name: "Faith O.", stylist_name: "Lulu Wigs",
    avatar_url: undefined,
  },
  { id: "demo-f3", author_id: "demo", stylist_id: "demo-4", booking_id: null,
    image_url: gradientSvg("#3F2233", "#823C20", "Loc journey"),
    caption: "Six month loc journey 🪢", category: "locs",
    likes_count: 211, comments_count: 34,
    expires_at: new Date(Date.now()+90*86400000).toISOString(),
    created_at: new Date(Date.now()-86400000).toISOString(),
    author_name: "Akinyi M.", stylist_name: "Locs By Imani",
    avatar_url: undefined,
  },
  { id: "demo-f4", author_id: "demo", stylist_id: "demo-2", booking_id: null,
    image_url: gradientSvg("#C4663F", "#3F2233", "Silk press"),
    caption: "Silk press for the girlies night 💫", category: "natural",
    likes_count: 76, comments_count: 9,
    expires_at: new Date(Date.now()+90*86400000).toISOString(),
    created_at: new Date(Date.now()-90000000).toISOString(),
    author_name: "Joy W.", stylist_name: "Nia Natural Hair",
    avatar_url: undefined,
  },
  { id: "demo-f5", author_id: "demo", stylist_id: "demo-5", booking_id: null,
    image_url: gradientSvg("#D8A85A", "#A8512E", "Chrome era"),
    caption: "Chrome era 💅🏾", category: "nails",
    likes_count: 132, comments_count: 14,
    expires_at: new Date(Date.now()+90*86400000).toISOString(),
    created_at: new Date(Date.now()-130000000).toISOString(),
    author_name: "Tasha L.", stylist_name: "Glow Nails Bar",
    avatar_url: undefined,
  },
];

export const isDemo = (id?: string) => !!id && id.startsWith("demo-");
