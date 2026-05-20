import { Suspense, lazy } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { CookieBanner } from "@/components/CookieBanner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LoadingScreen } from "@/components/LoadingScreen";

import Landing from "@/pages/Landing";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";

const Onboarding = lazy(() => import("@/pages/Onboarding"));
const Home = lazy(() => import("@/pages/Home"));
const Discover = lazy(() => import("@/pages/Discover"));
const StylistProfile = lazy(() => import("@/pages/StylistProfile"));
const Booking = lazy(() => import("@/pages/Booking"));
const Bookings = lazy(() => import("@/pages/Bookings"));
const PaymentCallback = lazy(() => import("@/pages/PaymentCallback"));
const Vault = lazy(() => import("@/pages/Vault"));
const Profile = lazy(() => import("@/pages/Profile"));
const Studio = lazy(() => import("@/pages/Studio"));
const Business = lazy(() => import("@/pages/Business"));
const PostCreate = lazy(() => import("@/pages/PostCreate"));
const GroupBooking = lazy(() => import("@/pages/GroupBooking"));

const Privacy = lazy(() => import("@/pages/legal/Privacy"));
const Terms = lazy(() => import("@/pages/legal/Terms"));
const Cookies = lazy(() => import("@/pages/legal/Cookies"));
const FAQs = lazy(() => import("@/pages/legal/FAQs"));
const About = lazy(() => import("@/pages/legal/About"));
const Contact = lazy(() => import("@/pages/legal/Contact"));
const HowItWorks = lazy(() => import("@/pages/legal/HowItWorks"));

function RequireAuth({ children }: { children: JSX.Element }) {
  const { session, profile, loading, profileLoaded } = useAuth();
  const loc = useLocation();
  if (loading) return <LoadingScreen />;
  if (!session) return <Navigate to="/auth" state={{ from: loc.pathname + loc.search }} replace />;
  // Have a session but the profile fetch hasn't resolved yet — never bounce
  // to /onboarding on a transient null. Wait for the real answer.
  if (!profileLoaded) return <LoadingScreen />;
  if (!profile && loc.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }
  if (profile && profile.onboarding_complete === false && loc.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }
  return children;
}

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/onboarding" element={<RequireAuth><Onboarding /></RequireAuth>} />
          <Route path="/home" element={<RequireAuth><Home /></RequireAuth>} />
          <Route path="/discover" element={<RequireAuth><Discover /></RequireAuth>} />
          <Route path="/stylist/:id" element={<RequireAuth><StylistProfile /></RequireAuth>} />
          <Route path="/book/:stylistId" element={<RequireAuth><Booking /></RequireAuth>} />
          <Route path="/bookings" element={<RequireAuth><Bookings /></RequireAuth>} />
          <Route path="/payment/callback" element={<RequireAuth><PaymentCallback /></RequireAuth>} />
          <Route path="/vault" element={<RequireAuth><Vault /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="/studio" element={<RequireAuth><Studio /></RequireAuth>} />
          <Route path="/business" element={<RequireAuth><Business /></RequireAuth>} />
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
      </Suspense>
      <CookieBanner />
    </ErrorBoundary>
  );
}
