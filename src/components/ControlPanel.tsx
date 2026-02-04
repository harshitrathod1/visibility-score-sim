import { RotateCcw, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SimulationConfig } from "@/types/company";

interface ControlPanelProps {
  config: SimulationConfig;
  onConfigChange: (config: SimulationConfig) => void;
  onReset: () => void;
  onRecalculate: () => void;
}

const BOOST_OPTIONS = [
  { value: "1.2", label: "1.2×" },
  { value: "2.0", label: "2.0×" },
  { value: "3.0", label: "3.0×" },
  { value: "custom", label: "Custom" },
];

export function ControlPanel({
  config,
  onConfigChange,
  onReset,
  onRecalculate,
}: ControlPanelProps) {
  const isPresetBoost = ["1.2", "2.0", "3.0"].includes(String(config.boostMultiplier));

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Calculator className="w-5 h-5 text-primary" />
          Simulation Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Boost Multiplier */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Boost Multiplier</Label>
          <div className="flex gap-3">
            <Select
              value={isPresetBoost ? String(config.boostMultiplier) : "custom"}
              onValueChange={(value) => {
                if (value !== "custom") {
                  onConfigChange({
                    ...config,
                    boostMultiplier: parseFloat(value),
                  });
                }
              }}
            >
              <SelectTrigger className="w-[120px] bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BOOST_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!isPresetBoost && (
              <Input
                type="number"
                step="0.1"
                min="1"
                max="10"
                value={config.boostMultiplier}
                onChange={(e) =>
                  onConfigChange({
                    ...config,
                    boostMultiplier: parseFloat(e.target.value) || 1,
                  })
                }
                className="w-[100px] bg-background"
              />
            )}
          </div>
        </div>

        {/* Total Ads Quantity */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <Label className="text-sm font-medium">Total Ads Quantity (6 months)</Label>
            <span className="text-sm text-muted-foreground">
              {formatNumber(config.totalAdsQty)}
            </span>
          </div>
          <Slider
            value={[config.totalAdsQty]}
            onValueChange={([value]) =>
              onConfigChange({ ...config, totalAdsQty: value })
            }
            max={config.adsCeiling * 2}
            step={50000}
            className="py-2"
          />
          <Input
            type="number"
            value={config.totalAdsQty}
            onChange={(e) =>
              onConfigChange({
                ...config,
                totalAdsQty: parseInt(e.target.value) || 0,
              })
            }
            className="bg-background"
          />
          <p className="text-xs text-muted-foreground">
            Distributed randomly across months 7-12
          </p>
        </div>

        {/* Ads Ceiling */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            Ads Ceiling (k_a): {formatNumber(config.adsCeiling)}
          </Label>
          <Input
            type="number"
            value={config.adsCeiling}
            onChange={(e) =>
              onConfigChange({
                ...config,
                adsCeiling: parseInt(e.target.value) || 600000,
              })
            }
            className="bg-background"
          />
          <p className="text-xs text-muted-foreground">
            Auto-assigned based on p100 tier
          </p>
        </div>

        {/* k value (p100) */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            Organic k (p100): {formatNumber(config.k)}
          </Label>
          <Input
            type="number"
            value={config.k}
            onChange={(e) =>
              onConfigChange({
                ...config,
                k: parseInt(e.target.value) || 1000,
              })
            }
            className="bg-background"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button onClick={onRecalculate} className="flex-1">
            <Calculator className="w-4 h-4 mr-2" />
            Recalculate
          </Button>
          <Button variant="outline" onClick={onReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
