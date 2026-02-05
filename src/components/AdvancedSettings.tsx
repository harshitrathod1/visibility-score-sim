 import { useState } from "react";
 import { ChevronDown, Settings } from "lucide-react";
 import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
 import { ControlPanel } from "@/components/ControlPanel";
 import type { SimulationConfig } from "@/types/company";
 
 interface AdvancedSettingsProps {
   config: SimulationConfig;
   onConfigChange: (config: SimulationConfig) => void;
   onReset: () => void;
   onRecalculate: () => void;
 }
 
 export function AdvancedSettings({
   config,
   onConfigChange,
   onReset,
   onRecalculate,
 }: AdvancedSettingsProps) {
   const [isOpen, setIsOpen] = useState(false);
 
   return (
     <Collapsible open={isOpen} onOpenChange={setIsOpen}>
       <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-card border border-border rounded-lg hover:bg-muted/50 transition-colors">
         <div className="flex items-center gap-2">
           <Settings className="w-5 h-5 text-muted-foreground" />
           <span className="font-medium text-foreground">Advanced Settings</span>
         </div>
         <ChevronDown
           className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${
             isOpen ? "rotate-180" : ""
           }`}
         />
       </CollapsibleTrigger>
       <CollapsibleContent className="mt-2">
         <ControlPanel
           config={config}
           onConfigChange={onConfigChange}
           onReset={onReset}
           onRecalculate={onRecalculate}
         />
       </CollapsibleContent>
     </Collapsible>
   );
 }