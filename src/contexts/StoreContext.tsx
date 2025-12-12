"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface Store {
  id: string;
  name: string;
  address: string;
  phone: string;
}

interface StoreContextType {
  stores: Store[];
  currentStore: Store | null;
  setCurrentStore: (store: Store) => void;
  // 設定値
  lowRatingThreshold: string;
  setLowRatingThreshold: (value: string) => void;
  translationEnabled: boolean;
  setTranslationEnabled: (value: boolean) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

// モック店舗データ
const mockStores: Store[] = [
  {
    id: "store-1",
    name: "渋谷本店",
    address: "東京都渋谷区渋谷1-1-1",
    phone: "03-1234-5678",
  },
  {
    id: "store-2",
    name: "新宿店",
    address: "東京都新宿区新宿2-2-2",
    phone: "03-2345-6789",
  },
  {
    id: "store-3",
    name: "池袋店",
    address: "東京都豊島区池袋3-3-3",
    phone: "03-3456-7890",
  },
  {
    id: "store-4",
    name: "横浜店",
    address: "神奈川県横浜市西区4-4-4",
    phone: "045-1234-5678",
  },
];

export function StoreProvider({ children }: { children: ReactNode }) {
  const [currentStore, setCurrentStore] = useState<Store | null>(mockStores[0]);
  const [lowRatingThreshold, setLowRatingThreshold] = useState("1-2");
  const [translationEnabled, setTranslationEnabled] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          if (data.storeName) {
            setCurrentStore(prev => prev ? { ...prev, name: data.storeName } : null);
          }
          if (data.lowRatingThreshold) setLowRatingThreshold(data.lowRatingThreshold);
          if (data.translationEnabled !== undefined) setTranslationEnabled(data.translationEnabled);
        }
      } catch (error) {
        console.error("Failed to fetch store settings", error);
      }
    };
    fetchSettings();
  }, []);

  return (
    <StoreContext.Provider
      value={{
        stores: mockStores,
        currentStore,
        setCurrentStore,
        lowRatingThreshold,
        setLowRatingThreshold,
        translationEnabled,
        setTranslationEnabled,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}