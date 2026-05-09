import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { CookieBanner } from "@/components/CookieBanner";
import { ErrorBoundary } from "@/components/ErrorBoundary";

import Landing from "@/pages/Landing";
import Auth from "@/pages/Auth";
import Onboarding from "@/pages/Onboarding";
import Home from "@/pages/Home";
import Discover from "@/pages/Discover";
import StylistProfile from "@/pages/StylistProfile";
import Booking from "@/pages/Booking";
import Bookings from "@/pages/Bookings";
import Vault from "@/pages/Vault";
import Profile from "@/pages/Profile";
import Studio from "@/pages/Studio";
import PostCreate from "@/pages/PostCreate";
import GroupBooking from "@/pages/GroupBooking";
import NotFound from "@/pages/NotFound";

import Privacy from "@/pages/legal/Privacy";
import Terms from "@/pages/legal/Terms";
import Cookies from "@/pages/legal/Cookies";
import FAQs from "@/pages/legal/FAQs";
import About from "@/pages/legal/About";
import Contact from "@/pages/legal/Contact";
import HowItWorks from "@/pages/legal/HowItWorks";

function RequireAuth({ children }: { children: JSX.Element }) {
  const { session, loading } = useAuth();
  const loc = useLocation();
  if (loading) return null;
  if (!session) return <Navigate to="/auth" state={{ from: loc.pathname }} replace />;
  return children;
}

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/onboarding" element={<RequireAuth><Onboarding /></RequireAuth>} />
        <Route path="/home" element={<RequireAuth><Home /></RequireAuth>} />
        <Route path="/discover" element={<RequireAuth><Discover /></RequireAuth>} />
        <Route path="/stylist/:id" element={<RequireAuth><StylistProfile /></RequireAuth>} />
        <Route path="/book/:stylistId" element={<RequireAuth><Booking /></RequireAuth>} />
        <Route path="/bookings" element={<RequireAuth><Bookings /></RequireAuth>} />
        <Route path="/vault" element={<RequireAuth><Vault /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
        <Route path="/studio" element={<RequireAuth><Studio /></RequireAuth>} />
        <Route path="/post" element={<RequireAuth><PostCreate /></RequireAuth>} />
        <Route path="/group/:stylistId" element={<RequireAuth><GroupBooking /></RequireAuth>} />

        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/cookies" element={<Cookies />} />
        <Route path="/faqs" element={<FAQs />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/how-it-works" element={<HowItWorks />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
      <CookieBanner />
    </ErrorBoundary>
  );
}
