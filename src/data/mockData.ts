import stylist1 from "@/assets/stylist-1.jpg";
import stylist2 from "@/assets/stylist-2.jpg";
import stylist3 from "@/assets/stylist-3.jpg";
import stylist4 from "@/assets/stylist-4.jpg";

export interface Stylist {
  id: string;
  name: string;
  image: string;
  rating: number;
  reviews: number;
  category: string;
  startingPrice: number;
  bio: string;
  yearsExperience: number;
  location: string;
  serviceAreas: string[];
  verified: boolean;
  services: Service[];
  portfolio: string[];
}

export interface Service {
  id: string;
  name: string;
  price: number;
  duration: string;
  description: string;
}

export const categories = [
  { label: "All", icon: "✨" },
  { label: "Braids", icon: "🪢" },
  { label: "Wig Install", icon: "💇‍♀️" },
  { label: "Natural Hair", icon: "🌿" },
  { label: "Barber", icon: "💈" },
  { label: "Makeup", icon: "💄" },
];

export const mockStylists: Stylist[] = [
  {
    id: "1",
    name: "Amina K.",
    image: stylist1,
    rating: 4.9,
    reviews: 156,
    category: "Braids",
    startingPrice: 2500,
    bio: "Specialist in all braid styles — knotless, box braids, cornrows & more. 6 years of making heads turn in Kilimani.",
    yearsExperience: 6,
    location: "Kilimani, Nairobi",
    serviceAreas: ["Kilimani", "Westlands", "Lavington", "Karen"],
    verified: true,
    services: [
      { id: "s1", name: "Knotless Braids", price: 3500, duration: "3-4 hrs", description: "Medium-length knotless box braids" },
      { id: "s2", name: "Box Braids", price: 2500, duration: "3-5 hrs", description: "Classic box braids, any length" },
      { id: "s3", name: "Cornrows", price: 1500, duration: "1-2 hrs", description: "Feed-in cornrows, any pattern" },
      { id: "s4", name: "Passion Twists", price: 4000, duration: "3-4 hrs", description: "Bohemian passion twists" },
    ],
    portfolio: [stylist1, stylist2, stylist4],
  },
  {
    id: "2",
    name: "Wanjiru M.",
    image: stylist2,
    rating: 4.8,
    reviews: 120,
    category: "Natural Hair",
    startingPrice: 2000,
    bio: "Natural hair care expert. Specializing in protective styles, twist-outs, and loc maintenance.",
    yearsExperience: 4,
    location: "Westlands, Nairobi",
    serviceAreas: ["Westlands", "Parklands", "Kilimani"],
    verified: true,
    services: [
      { id: "s5", name: "Twist Out", price: 2000, duration: "1-2 hrs", description: "Defined twist-out styling" },
      { id: "s6", name: "Loc Maintenance", price: 3000, duration: "2-3 hrs", description: "Retwist and styling" },
      { id: "s7", name: "Silk Press", price: 3500, duration: "2 hrs", description: "Heat-free silk press finish" },
    ],
    portfolio: [stylist2, stylist1, stylist4],
  },
  {
    id: "3",
    name: "Brian O.",
    image: stylist3,
    rating: 4.7,
    reviews: 89,
    category: "Barber",
    startingPrice: 500,
    bio: "Premium barber services. Clean fades, beard grooming, and men's styling. Mobile service available.",
    yearsExperience: 8,
    location: "CBD, Nairobi",
    serviceAreas: ["CBD", "Upperhill", "South B", "South C"],
    verified: true,
    services: [
      { id: "s8", name: "Fade Haircut", price: 500, duration: "30 min", description: "Clean skin fade or taper" },
      { id: "s9", name: "Beard Trim", price: 300, duration: "15 min", description: "Shape and line-up" },
      { id: "s10", name: "Full Grooming", price: 1000, duration: "1 hr", description: "Haircut + beard + hot towel" },
    ],
    portfolio: [stylist3, stylist3, stylist3],
  },
  {
    id: "4",
    name: "Fatima N.",
    image: stylist4,
    rating: 4.9,
    reviews: 203,
    category: "Wig Install",
    startingPrice: 3000,
    bio: "Wig install queen. Frontal installs, closures, and custom wig making. Celebrity clientele.",
    yearsExperience: 5,
    location: "Lavington, Nairobi",
    serviceAreas: ["Lavington", "Kilimani", "Karen", "Runda"],
    verified: true,
    services: [
      { id: "s11", name: "Frontal Install", price: 4500, duration: "2 hrs", description: "HD lace frontal wig install" },
      { id: "s12", name: "Closure Install", price: 3000, duration: "1.5 hrs", description: "Closure wig install" },
      { id: "s13", name: "Custom Wig", price: 8000, duration: "3-5 days", description: "Custom-made wig with install" },
    ],
    portfolio: [stylist4, stylist1, stylist2],
  },
];
