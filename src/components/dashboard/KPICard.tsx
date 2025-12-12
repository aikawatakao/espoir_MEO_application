import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  id: string;
  title: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  onClick?: () => void;
}

export function KPICard({
  id,
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  onClick,
}: KPICardProps) {
  const getTrendIcon = () => {
    if (!trend) return null;
    
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case "neutral":
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Card
      className={`shadow-sm transition-all ${onClick ? "cursor-pointer hover:shadow-md hover:scale-[1.02]" : ""}`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
        {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-3">
          {Icon && <Icon className="h-6 w-6 text-primary" />}
          <div className="text-3xl font-semibold tracking-tight">{value}</div>
        </div>
        {trend && (
          <div className="flex items-center gap-1.5 text-sm">
            {getTrendIcon()}
            {trendValue && <span className="font-light text-muted-foreground">{trendValue}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}