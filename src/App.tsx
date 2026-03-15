import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import BottomNav from "@/components/BottomNav";
import Index from "./pages/Index";
import Welcome from "./pages/Welcome";
import Auth from "./pages/Auth";
import StylistProfile from "./pages/StylistProfile";
import Booking from "./pages/Booking";
import Payment from "./pages/Payment";
import Bookings from "./pages/Bookings";
import Explore from "./pages/Explore";
import MapView from "./pages/MapView";
import Chat from "./pages/Chat";
import ChatConversation from "./pages/ChatConversation";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import PaymentMethods from "./pages/PaymentMethods";
import ProfilePlaceholder from "./pages/ProfilePlaceholder";
import StylistDashboard from "./pages/StylistDashboard";
import HomeServiceTracking from "./pages/HomeServiceTracking";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<Index />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/stylist/:id" element={<StylistProfile />} />
            <Route path="/booking/:stylistId/:serviceId" element={<Booking />} />
            <Route path="/payment/:stylistId/:serviceId" element={<Payment />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/home-services" element={<HomeServiceTracking />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/chat/:recipientId" element={<ChatConversation />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/edit" element={<EditProfile />} />
            <Route path="/profile/payments" element={<ProfilePlaceholder />} />
            <Route path="/profile/reviews" element={<ProfilePlaceholder />} />
            <Route path="/profile/settings" element={<ProfilePlaceholder />} />
            <Route path="/profile/help" element={<ProfilePlaceholder />} />
            <Route path="/dashboard" element={<StylistDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <BottomNav />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
