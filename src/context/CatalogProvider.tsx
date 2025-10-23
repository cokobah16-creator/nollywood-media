import React, { createContext, useContext, useEffect, useState } from "react";
import { Film, FilterSpec, SortKey, filterFilms } from "../lib/catalog";

interface CatalogContextValue {
  films: Film[];
  loading: boolean;
  error: Error | null;
  filter: (where: FilterSpec, sort?: SortKey) => Film[];
}

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [films, setFilms] = useState<Film[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetch("/nollywood_originals_catalog.json")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load catalog");
        return res.json();
      })
      .then((data: Film[]) => {
        setFilms(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  }, []);

  const filter = (where: FilterSpec, sort?: SortKey): Film[] => {
    return filterFilms(films, where, sort);
  };

  return (
    <CatalogContext.Provider value={{ films, loading, error, filter }}>
      {children}
    </CatalogContext.Provider>
  );
}

export function useCatalog(): CatalogContextValue {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error("useCatalog must be used within CatalogProvider");
  }
  return context;
}
