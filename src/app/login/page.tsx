"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleGoogleLogin = () => {
        setIsLoading(true);
        setError(null);
        window.location.href = '/api/auth/login';
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4">
            <div className="mb-40 flex flex-col items-center space-y-6" style={{ paddingTop: "160px" }}>
                {/* Logo Area */}
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary">
                    <svg className="h-12 w-12 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5z" />
                        <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                </div>

                {/* Title */}
                <div className="text-center space-y-2">
                    <h2 className="text-center">Googleでかんたんログイン</h2>
                </div>

                {/* Error */}
                {error && (
                    <Alert variant="destructive" className="max-w-[300px]">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Google Login Button */}
                <Button
                    id="btn_google"
                    className="w-[300px]"
                    size="lg"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            ログイン中...
                        </>
                    ) : (
                        <>
                            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                                <path
                                    fill="currentColor"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                            Googleでログイン
                        </>
                    )}
                </Button>

                {/* Dev Login Button - Removed for production clean up */}
            </div>

            {/* Footer Links */}
            <div className="fixed bottom-8 text-center text-sm text-muted-foreground">
                <a
                    id="lnk_tos"
                    href="#"
                    className="hover:underline"
                >
                    利用規約
                </a>
                {" · "}
                <a
                    href="#"
                    className="hover:underline"
                >
                    プライバシーポリシー
                </a>
            </div>
        </div>
    );
}
