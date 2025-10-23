import { useState } from "react";
import { CatalogProvider } from "./context/CatalogProvider";
import { AuthProvider } from "./context/AuthContext";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { Footer } from "./components/Footer";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Home from "./pages/Home";
import GenrePage from "./pages/GenrePage";
import RegionPage from "./pages/RegionPage";
import SearchPage from "./pages/SearchPage";
import WatchPage from "./pages/WatchPage";
import ContentTypePage from "./pages/ContentTypePage";
import Catalog from "./components/Catalog";
import { AdminLogin } from "./pages/AdminLogin";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { AdminDashboard } from "./pages/admin/Dashboard";
import { AdminFilms } from "./pages/admin/Films";
import { FilmEditor } from "./pages/admin/FilmEditor";
import { AdminUsers } from "./pages/admin/Users";
import { AdminAnalytics } from "./pages/admin/Analytics";
import { AdminSettings } from "./pages/admin/Settings";
import { AdminUpload } from "./pages/admin/Upload";
import { AdminModeration } from "./pages/admin/Moderation";
import { AdminCompliance } from "./pages/admin/Compliance";
import { AccountLayout } from "./pages/account/AccountLayout";
import { Profile } from "./pages/account/Profile";
import { WatchHistory } from "./pages/account/WatchHistory";
import { Watchlist } from "./pages/account/Watchlist";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ResetPassword } from "./pages/ResetPassword";
import { Terms } from "./pages/Terms";
import { Privacy } from "./pages/Privacy";
import { Upload } from "./pages/account/Upload";
import { MyUploads } from "./pages/account/MyUploads";
import { UserUploads } from "./pages/admin/UserUploads";
import { Notifications } from "./pages/account/Notifications";
import { Subscription } from "./pages/account/Subscription";
import { StudioLayout } from "./pages/studio/StudioLayout";
import { StudioDashboard } from "./pages/studio/Dashboard";
import { StudioAnalytics } from "./pages/studio/Analytics";
import { StudioContent } from "./pages/studio/Content";
import { StudioSubscribers } from "./pages/studio/Subscribers";
import { StudioComments } from "./pages/studio/Comments";
import { StudioEarn } from "./pages/studio/Earn";
import { AddFilm } from "./pages/admin/AddFilm";
import AboutUs from "./pages/AboutUs";
import Careers from "./pages/Careers";
import Contact from "./pages/Contact";
import HelpCenter from "./pages/HelpCenter";
import Explore from "./pages/Explore";
import Trending from "./pages/Trending";
import ContinueWatching from "./pages/ContinueWatching";

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthProvider>
      <CatalogProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route path="/admin" element={
              <ProtectedRoute requireAdmin>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="films" element={<AdminFilms />} />
              <Route path="films/:id" element={<FilmEditor />} />
              <Route path="films/new" element={<AddFilm />} />
              <Route path="upload" element={<AdminUpload />} />
              <Route path="moderation" element={<AdminModeration />} />
              <Route path="compliance" element={<AdminCompliance />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="user-uploads" element={<UserUploads />} />
            </Route>

            <Route path="/studio" element={
              <ProtectedRoute>
                <StudioLayout />
              </ProtectedRoute>
            }>
              <Route index element={<StudioDashboard />} />
              <Route path="analytics" element={<StudioAnalytics />} />
              <Route path="content" element={<StudioContent />} />
              <Route path="subscribers" element={<StudioSubscribers />} />
              <Route path="comments" element={<StudioComments />} />
              <Route path="earn" element={<StudioEarn />} />
            </Route>

            <Route path="/about" element={<AboutUs />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/help" element={<HelpCenter />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/trending" element={<Trending />} />
            <Route path="/continue-watching" element={
              <ProtectedRoute>
                <ContinueWatching />
              </ProtectedRoute>
            } />

            <Route path="/account" element={
              <ProtectedRoute>
                <AccountLayout />
              </ProtectedRoute>
            }>
              <Route path="profile" element={<Profile />} />
              <Route path="history" element={<WatchHistory />} />
              <Route path="watchlist" element={<Watchlist />} />
              <Route path="upload" element={<Upload />} />
              <Route path="my-uploads" element={<MyUploads />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="subscription" element={<Subscription />} />
            </Route>

            <Route path="*" element={
              <div className="flex min-h-screen flex-col bg-white dark:bg-gray-900">
                <Header onMenuClick={() => setSidebarOpen(true)} />
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <div className="flex-1">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/catalog" element={<Catalog />} />
                    <Route path="/genre/:genre" element={<GenrePage />} />
                    <Route path="/region/:name" element={<RegionPage />} />
                    <Route path="/content/:type" element={<ContentTypePage />} />
                    <Route path="/search" element={<SearchPage />} />
                    <Route path="/watch/:id" element={<WatchPage />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/privacy" element={<Privacy />} />
                  </Routes>
                </div>
                <Footer />
              </div>
            } />
          </Routes>
        </BrowserRouter>
      </CatalogProvider>
    </AuthProvider>
  );
}
