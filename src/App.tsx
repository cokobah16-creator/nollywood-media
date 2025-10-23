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

export default function App() {
  return (
    <AuthProvider>
      <CatalogProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/admin/login" element={<AdminLogin />} />

            <Route path="/admin" element={
              <ProtectedRoute requireAdmin>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="films" element={<AdminFilms />} />
              <Route path="films/:id" element={<FilmEditor />} />
              <Route path="upload" element={<AdminUpload />} />
              <Route path="moderation" element={<AdminModeration />} />
              <Route path="compliance" element={<AdminCompliance />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            <Route path="/account" element={
              <ProtectedRoute>
                <AccountLayout />
              </ProtectedRoute>
            }>
              <Route path="profile" element={<Profile />} />
              <Route path="history" element={<WatchHistory />} />
              <Route path="watchlist" element={<Watchlist />} />
            </Route>

            <Route path="*" element={
              <div className="flex min-h-screen flex-col bg-white">
                <Header />
                <Sidebar />
                <div className="flex-1">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/catalog" element={<Catalog />} />
                    <Route path="/genre/:genre" element={<GenrePage />} />
                    <Route path="/region/:name" element={<RegionPage />} />
                    <Route path="/content/:type" element={<ContentTypePage />} />
                    <Route path="/search" element={<SearchPage />} />
                    <Route path="/watch/:id" element={<WatchPage />} />
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
