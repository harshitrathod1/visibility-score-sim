 import { TrendingUp, Zap, Megaphone } from "lucide-react";
 import { Card, CardContent } from "@/components/ui/card";
 import type { MonthlyResult } from "@/types/company";
 
 interface MonthlyAveragesCardProps {
   monthlyResults: MonthlyResult[];
 }
 
 export function MonthlyAveragesCard({ monthlyResults }: MonthlyAveragesCardProps) {
   const subscriptionMonths = monthlyResults.slice(6);
   
   const avgOrganic =
     subscriptionMonths.reduce((sum, r) => sum + r.organicImpressions, 0) / 6;
   const avgBoosted =
     subscriptionMonths.reduce((sum, r) => sum + r.boostImpressions, 0) / 6;
   const avgAds =
     subscriptionMonths.reduce((sum, r) => sum + r.adsImpressions, 0) / 6;
 
   const formatNumber = (num: number) => {
     if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
     if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
     return num.toFixed(0);
   };
 
   const metrics = [
     {
       label: "Organic",
       value: avgOrganic,
       icon: TrendingUp,
       borderColor: "border-l-[hsl(var(--chart-organic))]",
       iconColor: "text-[hsl(var(--chart-organic))]",
     },
     {
       label: "Boosted",
       value: avgBoosted,
       icon: Zap,
       borderColor: "border-l-[hsl(var(--chart-boost))]",
       iconColor: "text-[hsl(var(--chart-boost))]",
     },
     {
       label: "Ads",
       value: avgAds,
       icon: Megaphone,
       borderColor: "border-l-[hsl(var(--chart-ads))]",
       iconColor: "text-[hsl(var(--chart-ads))]",
     },
   ];
 
   return (
     <div className="grid grid-cols-3 gap-4">
       {metrics.map((metric) => (
         <Card
           key={metric.label}
           className={`bg-card border-border border-l-4 ${metric.borderColor}`}
         >
           <CardContent className="p-4 flex items-center gap-3">
             <div className={`p-2 rounded-lg bg-muted ${metric.iconColor}`}>
               <metric.icon className="w-5 h-5" />
             </div>
             <div>
               <p className="text-xs text-muted-foreground">{metric.label}</p>
               <p className="text-lg font-semibold text-foreground">
                 {formatNumber(metric.value)}
               </p>
             </div>
           </CardContent>
         </Card>
       ))}
     </div>
   );
 }