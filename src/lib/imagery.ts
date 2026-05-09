// Curated, verified Unsplash photo IDs of Black women and African
// hair/beauty imagery. Each ID hand-picked from Unsplash creators and
// collections featuring Black photographers and subjects.
//
// All images use a lazy-loading gradient fallback (see SmartImage) so the
// UI never breaks if a photo is taken down or the network blocks it.

export const HAIR_PHOTOS = {
  braidsHero:    "1620331311520-246422fd82f9", // long box braids portrait
  braidsClose:   "1605497788044-5a32c7078486", // braids close detail
  braidsWedding: "1559599101-f09722fb4948",    // braids back, formal
  naturalHero:   "1581252584837-9f0b1d3bf82c", // natural curls portrait
  naturalAfro:   "1614283233556-f35b0c801ef1", // natural afro
  wigsHero:      "1580894732444-8ecded7900cd", // sleek wig install
  locsHero:      "1601412436009-d964bd02edbc", // locs portrait
  locsLong:      "1604881991720-f91add269bed", // long locs
  nailsHero:     "1604654894610-df63bc536371", // nail art
  barberHero:    "1599351431202-1e0f0137899a", // fresh fade
  silkPress:     "1542196608-4c3eebc4ae34",    // silk press blow-out
  smile:         "1531123414780-f74242c2b052", // headshot portrait
} as const;

export const AVATAR_PHOTOS = [
  "1531123414780-f74242c2b052",
  "1614283233556-f35b0c801ef1",
  "1604881991720-f91add269bed",
  "1542196608-4c3eebc4ae34",
  "1593104547489-5cfb3839a3b5",
] as const;

export const photoUrl = (id: string, w = 900) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=70`;

export const avatarUrl = (id: string) => photoUrl(id, 200);

// Deterministic gradient fallback for any string key.
const GRADS = [
  "from-terracotta-700 via-terracotta-500 to-aubergine-700",
  "from-aubergine-700 via-terracotta-600 to-gold-500",
  "from-terracotta-300 via-terracotta-500 to-aubergine-500",
  "from-aubergine-500 via-aubergine-700 to-terracotta-700",
  "from-gold-400 via-terracotta-500 to-aubergine-700",
];
export const gradientFor = (key: string) => {
  let h = 0; for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return GRADS[h % GRADS.length];
};
