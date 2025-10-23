import { CatalogProvider } from "./context/CatalogProvider";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header } from "./components/Header";
import Home from "./pages/Home";
import GenrePage from "./pages/GenrePage";
import RegionPage from "./pages/RegionPage";
import SearchPage from "./pages/SearchPage";
import WatchPage from "./pages/WatchPage";
import ContentTypePage from "./pages/ContentTypePage";
import Catalog from "./components/Catalog";

export default function App() {
  return (
    <CatalogProvider>
      <BrowserRouter>
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
      </BrowserRouter>
    </CatalogProvider>
  );
}
