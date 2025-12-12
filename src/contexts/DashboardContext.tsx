"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface DashboardSettings {
  kpis: {
    reviewCount: boolean;
    averageRating: boolean;
    unreplied: boolean;
    impressions: boolean;
    phoneClicks: boolean;
    lowRating: boolean;
    directions: boolean;  // ルート検索回数
    websiteClicks: boolean;  // Webサイトクリック数
    ctr: boolean;  // CTR
  };
  graphs: {
    reviewTrend: boolean;
    replyRate: boolean;
    gbpPerformance: boolean;
    reviewAnalytics: boolean;
  };
}

interface DashboardContextType {
  settings: DashboardSettings;
  updateKPISettings: (key: keyof DashboardSettings["kpis"], value: boolean) => void;
  updateGraphSettings: (key: keyof DashboardSettings["graphs"], value: boolean) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

const defaultSettings: DashboardSettings = {
  kpis: {
    reviewCount: true,
    averageRating: true,
    unreplied: true,
    impressions: true,
    phoneClicks: true,
    lowRating: true,
    directions: true,
    websiteClicks: true,
    ctr: true,
  },
  graphs: {
    reviewTrend: true,
    replyRate: true,
    gbpPerformance: true,
    reviewAnalytics: true,
  },
};

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<DashboardSettings>(defaultSettings);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          if (data.dashboardSettings) {
            // Deep merge or replace? Replace is safer if structure matches
            // But we need to be careful about missing keys.
            // Let's assume data.dashboardSettings has the correct structure or partial
            setSettings(prev => ({
              ...prev,
              ...data.dashboardSettings,
              kpis: { ...prev.kpis, ...(data.dashboardSettings.kpis || {}) },
              graphs: { ...prev.graphs, ...(data.dashboardSettings.graphs || {}) }
            }));
          }
        }
      } catch (error) {
        console.error("Failed to fetch dashboard settings", error);
      }
    };
    fetchSettings();
  }, []);

  const updateKPISettings = (key: keyof DashboardSettings["kpis"], value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      kpis: {
        ...prev.kpis,
        [key]: value,
      },
    }));
  };

  const updateGraphSettings = (key: keyof DashboardSettings["graphs"], value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      graphs: {
        ...prev.graphs,
        [key]: value,
      },
    }));
  };

  return (
    <DashboardContext.Provider
      value={{
        settings,
        updateKPISettings,
        updateGraphSettings,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}