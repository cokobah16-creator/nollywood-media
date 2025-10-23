import { CatalogProvider } from "./context/CatalogProvider";
import { AuthProvider } from "./context/AuthContext";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header } from "./components/Header";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Home from "./pages/Home";
import GenrePage from "./pages/GenrePage";
import RegionPage from "./pages/RegionPage";
import SearchPage from "./pages/SearchPage";
import WatchPage from "./pages/WatchPage";
import ContentTypePage from "./pages/ContentTypePage";
import Catalog from "./components/Catalog";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { AdminDashboard } from "./pages/admin/Dashboard";
import { AdminFilms } from "./pages/admin/Films";
import { FilmEditor } from "./pages/admin/FilmEditor";
import { AdminUsers } from "./pages/admin/Users";
import { AdminAnalytics } from "./pages/admin/Analytics";
import { AdminSettings } from "./pages/admin/Settings";

export default function App() {
  return (
    <AuthProvider>
      <CatalogProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="films" element={<AdminFilms />} />
              <Route path="films/:id" element={<FilmEditor />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            <Route path="*" element={
              <div className="min-h-screen bg-slate-950">
                <Header />
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
            } />
          </Routes>
        </BrowserRouter>
      </CatalogProvider>
    </AuthProvider>
  );
}
