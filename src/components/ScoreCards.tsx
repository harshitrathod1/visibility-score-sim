 import { ArrowUp } from "lucide-react";
 import { Card, CardContent } from "@/components/ui/card";
 import type { MonthlyResult } from "@/types/company";
 
 interface ScoreCardsProps {
   monthlyResults: MonthlyResult[];
 }
 
 export function ScoreCards({ monthlyResults }: ScoreCardsProps) {
   const avgBefore =
     monthlyResults.slice(0, 6).reduce((sum, r) => sum + r.totalScore, 0) / 6;
   const avgAfter =
     monthlyResults.slice(6).reduce((sum, r) => sum + r.totalScore, 0) / 6;
   const hasImprovement = avgAfter > avgBefore;
 
   return (
     <div className="grid grid-cols-2 gap-4">
       <Card className="bg-card border-border">
         <CardContent className="p-6">
           <p className="text-sm text-muted-foreground mb-1">
             Avg Visibility Before
           </p>
           <p className="text-xs text-muted-foreground mb-2">Free Tier (Months 1-6)</p>
           <p className="text-3xl font-bold text-foreground">
             {avgBefore.toFixed(1)}
           </p>
         </CardContent>
       </Card>
 
       <Card className="bg-card border-border">
         <CardContent className="p-6">
           <p className="text-sm text-muted-foreground mb-1">
             Avg Visibility After
           </p>
           <p className="text-xs text-muted-foreground mb-2">Subscription (Months 7-12)</p>
           <div className="flex items-center gap-2">
             <p className="text-3xl font-bold text-foreground">
               {avgAfter.toFixed(1)}
             </p>
             {hasImprovement && (
               <div className="flex items-center text-[hsl(var(--chart-ads))]">
                 <ArrowUp className="w-5 h-5" />
                 <span className="text-sm font-medium">
                   +{(avgAfter - avgBefore).toFixed(1)}
                 </span>
               </div>
             )}
           </div>
         </CardContent>
       </Card>
     </div>
   );
 }