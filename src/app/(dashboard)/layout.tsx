import { Header } from "@/components/layout/Header";
import { Navigation } from "@/components/layout/Navigation";
import { StoreProvider } from "@/contexts/StoreContext";
import { DashboardProvider } from "@/contexts/DashboardContext";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <StoreProvider>
            <DashboardProvider>
                <div className="flex h-screen flex-col">
                    <Header />
                    <div className="flex flex-1 overflow-hidden">
                        <Navigation />
                        <main className="flex-1 overflow-auto bg-muted/10 p-4 md:p-6">
                            {children}
                        </main>
                    </div>
                </div>
            </DashboardProvider>
        </StoreProvider>
    );
}
