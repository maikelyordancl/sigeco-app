"use client";

import { useNode } from "@craftjs/core";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { CraftSpacerProps } from "./types";

export const SpacerSettings = () => {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props as CraftSpacerProps,
  }));

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="height">Altura (px)</Label>
        <Input
          id="height"
          type="number"
          min="1"
          value={props.height}
          onChange={(e) => setProp((props: CraftSpacerProps) => (props.height = parseInt(e.target.value, 10)), 500)}
        />
      </div>
      <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
                <Label>Mostrar línea divisoria</Label>
            </div>
            <Switch
                checked={props.showLine}
                onCheckedChange={(checked) => setProp((props: CraftSpacerProps) => (props.showLine = checked))}
            />
        </div>
    </div>
  );
};