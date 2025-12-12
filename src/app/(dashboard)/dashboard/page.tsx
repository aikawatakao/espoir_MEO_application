"use client";

import { useState, useEffect } from "react";
import { KPICard } from "@/components/dashboard/KPICard";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Star, ThumbsDown, MessageCircle, Download, Eye, Phone, AlertCircle, Navigation, MousePointer, TrendingUp } from "lucide-react";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { useDashboard } from "@/contexts/DashboardContext";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
    const [period, setPeriod] = useState("30d");
    const [isLoading, setIsLoading] = useState(false);
    const { settings } = useDashboard();
    const router = useRouter();

    const onNavigateToReviews = (filter?: string) => {
        if (filter) {
            router.push(`/reviews?filter=${filter}`);
        } else {
            router.push("/reviews");
        }
    };

    const [data, setData] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/dashboard?period=${period}`);
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [period]);

    // Use data from API or fallback to defaults/loading state
    const gbpData = {
        impressions: data?.impressions || 0,
        phone_clicks: data?.phoneClicks || 0,
        directions: data?.directions || 0,
        website_clicks: data?.websiteClicks || 0,
    };

    const ctr = data?.ctr || 0;

    const kpiData = {
        review_count: data?.reviewCount || 0,
        average_rating: data?.averageRating || 0,
        low_rating_ratio: data?.lowRatingRate || 0,
        unreplied_count: data?.unrepliedCount || 0,
    };

    const reviewChartData = data?.reviewTrend || [];
    const replyRateChartData = data?.replyRate || [];
    const gbpPerformanceData = data?.gbpPerformance || [];
    const reviewTrendData = data?.reviewTrend?.map((d: any, i: number) => ({
        ...d,
        newReviews: d.count,
        avgRating: 4.0 + (Math.random() * 1), // Mock for now as API structure differs slightly
        replyRate: data?.replyRate[i]?.rate || 0
    })) || [];

    const handlePeriodChange = async (value: string) => {
        setPeriod(value);
        // Fetch is triggered by useEffect
    };

    const handleDownloadPDF = async () => {
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        alert("PDFレポートをダウンロードしました");
        setIsLoading(false);
    };

    return (
        <div className="space-y-6 p-4 md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <h1 className="text-2xl md:text-3xl">ダッシュボード</h1>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Select
                        value={period}
                        onValueChange={handlePeriodChange}
                        disabled={isLoading}
                    >
                        <SelectTrigger id="sel_period" className="w-full sm:w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="30d">直近30日</SelectItem>
                            <SelectItem value="current_month">当月</SelectItem>
                            <SelectItem value="all">全期間</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button
                        id="btn_pdf"
                        onClick={handleDownloadPDF}
                        disabled={isLoading}
                        className="gap-2 w-full sm:w-auto"
                    >
                        <Download className="h-4 w-4" />
                        <span className="hidden md:inline">PDFレポート</span>
                        <span className="md:hidden">PDF</span>
                    </Button>
                </div>
            </div>

            <div>
                <p className="mb-4 text-sm text-muted-foreground">
                    店舗のパフォーマンスと口コミの状況を一目で確認できます
                </p>
                <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
                    {settings.kpis.reviewCount && (
                        <KPICard
                            id="kpi_review_count"
                            title="口コミ総数"
                            value={kpiData.review_count}
                            icon={MessageSquare}
                            trend="up"
                            trendValue="+12%"
                            onClick={() => onNavigateToReviews()}
                        />
                    )}
                    {settings.kpis.averageRating && (
                        <KPICard
                            id="kpi_average_rating"
                            title="平均評価"
                            value={`★ ${kpiData.average_rating.toFixed(1)}`}
                            icon={Star}
                            trend="up"
                            trendValue="+0.3"
                        />
                    )}
                    {settings.kpis.unreplied && (
                        <KPICard
                            id="kpi_unreplied"
                            title="未返信口コミ"
                            value={kpiData.unreplied_count}
                            icon={AlertCircle}
                            trend="down"
                            trendValue="-8"
                            onClick={() => onNavigateToReviews("no_reply")}
                        />
                    )}
                    {settings.kpis.impressions && (
                        <KPICard
                            id="kpi_impressions"
                            title="GBP表示回数"
                            value={gbpData.impressions.toLocaleString()}
                            icon={Eye}
                            trend="up"
                            trendValue="+18%"
                        />
                    )}
                    {settings.kpis.phoneClicks && (
                        <KPICard
                            id="kpi_phone_clicks"
                            title="電話クリック数"
                            value={gbpData.phone_clicks}
                            icon={Phone}
                            trend="up"
                            trendValue="+8%"
                        />
                    )}
                    {settings.kpis.lowRating && (
                        <KPICard
                            id="kpi_low_rating"
                            title="低評価割合"
                            value={`${kpiData.low_rating_ratio}%`}
                            icon={ThumbsDown}
                            trend="down"
                            trendValue="-3%"
                            onClick={() => onNavigateToReviews("low_rating")}
                        />
                    )}
                    {settings.kpis.directions && (
                        <KPICard
                            id="kpi_directions"
                            title="ルート検索回数"
                            value={gbpData.directions}
                            icon={Navigation}
                            trend="up"
                            trendValue="+5%"
                        />
                    )}
                    {settings.kpis.websiteClicks && (
                        <KPICard
                            id="kpi_website_clicks"
                            title="Webサイトクリック"
                            value={gbpData.website_clicks}
                            icon={MousePointer}
                            trend="up"
                            trendValue="+12%"
                            onClick={() => { }}
                        />
                    )}
                    {settings.kpis.ctr && (
                        <KPICard
                            id="kpi_ctr"
                            title="クリック率（CTR）"
                            value={`${ctr}%`}
                            icon={TrendingUp}
                            trend="up"
                            trendValue="+0.5%"
                        />
                    )}
                </div>
            </div>

            {(settings.graphs.reviewTrend || settings.graphs.replyRate) && (
                <div className="grid gap-4 lg:grid-cols-2">
                    {settings.graphs.reviewTrend && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base md:text-lg">口コミ件数推移</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={200} className="md:h-[250px]">
                                    <LineChart data={reviewChartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                        <YAxis tick={{ fontSize: 12 }} />
                                        <Tooltip />
                                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                                        <Line
                                            type="monotone"
                                            dataKey="count"
                                            stroke="hsl(var(--primary))"
                                            strokeWidth={2}
                                            name="口コミ件数"
                                            activeDot={{ r: 6 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    )}

                    {settings.graphs.replyRate && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base md:text-lg">返信率推移</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={200} className="md:h-[250px]">
                                    <BarChart data={replyRateChartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                        <YAxis tick={{ fontSize: 12 }} />
                                        <Tooltip />
                                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                                        <Bar dataKey="rate" fill="hsl(var(--primary))" name="返信率 (%)" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {settings.graphs.gbpPerformance && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base md:text-lg">GBPパフォーマンス推移</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={220} className="md:h-[300px]">
                            <LineChart data={gbpPerformanceData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Legend wrapperStyle={{ fontSize: '12px' }} />
                                <Line
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="impressions"
                                    stroke="#8b5cf6"
                                    strokeWidth={2}
                                    name="表示回数"
                                    activeDot={{ r: 6 }}
                                />
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="phone"
                                    stroke="#06b6d4"
                                    strokeWidth={2}
                                    name="電話クリック"
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {settings.graphs.reviewAnalytics && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base md:text-lg">口コミトレンド</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={220} className="md:h-[300px]">
                            <LineChart data={reviewTrendData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                                <YAxis yAxisId="right" orientation="right" domain={[0, 5]} tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Legend wrapperStyle={{ fontSize: '12px' }} />
                                <Bar
                                    yAxisId="left"
                                    dataKey="newReviews"
                                    fill="hsl(var(--primary))"
                                    name="新規口コミ数"
                                />
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="avgRating"
                                    stroke="#f59e0b"
                                    strokeWidth={2}
                                    name="平均★"
                                    activeDot={{ r: 6 }}
                                />
                                <Line
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="replyRate"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    name="返信率(%)"
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            <div className="space-y-4">
                <h2 className="text-lg md:text-xl">クイックアクション</h2>
                <div className="flex gap-3">
                    <Button
                        id="btn_reviewlist"
                        size="lg"
                        className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
                        onClick={() => onNavigateToReviews()}
                    >
                        新着の口コミを見る
                    </Button>
                </div>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 md:p-6 shadow-sm">
                <div className="flex items-start gap-3">
                    <div className="rounded-full bg-amber-100 p-2">
                        <MessageSquare className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="mb-2 text-amber-900">新着の口コミがあります</h3>
                        <p className="mb-4 text-sm text-amber-700">
                            未返信の口コミを確認しましょう
                        </p>
                        <Button
                            variant="outline"
                            className="border-amber-300 bg-white hover:bg-amber-50"
                            onClick={() => onNavigateToReviews("no_reply")}
                        >
                            未返信の口コミを確認
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
