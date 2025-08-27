"use client";

import { useNode } from "@craftjs/core";
import { Label } from "@/components/ui/label";
import { CraftColumnsProps } from "./CraftColumns";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Slider } from "../ui/slider";

export const ColumnsSettings = () => {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props as CraftColumnsProps,
  }));

  return (
    <div className="space-y-4">
      <div>
        <Label>Número de Columnas</Label>
        <RadioGroup
          value={String(props.columnCount)}
          onValueChange={(value: string) => setProp((props: CraftColumnsProps) => (props.columnCount = parseInt(value, 10)))}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="2" id="cols-2" />
            <Label htmlFor="cols-2">2 Columnas</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="3" id="cols-3" />
            <Label htmlFor="cols-3">3 Columnas</Label>
          </div>
        </RadioGroup>
      </div>

      {props.columnCount === 2 && (
        <div>
          <Label>Distribución</Label>
          <RadioGroup
            value={props.distribution}
            onValueChange={(value: string) => setProp((props: CraftColumnsProps) => (props.distribution = value as "even" | "left-heavy" | "right-heavy"))}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="even" id="dist-even" />
              <Label htmlFor="dist-even">Iguales (50/50)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="left-heavy" id="dist-left" />
              <Label htmlFor="dist-left">Ancha a la Izquierda (67/33)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="right-heavy" id="dist-right" />
              <Label htmlFor="dist-right">Ancha a la Derecha (33/67)</Label>
            </div>
          </RadioGroup>
        </div>
      )}

      <div>
        <Label>Espaciado entre Columnas (gap)</Label>
        <div className="flex items-center gap-2">
          <Slider
            min={0}
            max={50}
            step={1}
            value={[props.gap]}
            onValueChange={([value]: number[]) => setProp((props: CraftColumnsProps) => (props.gap = value))}
          />
          <span className="text-sm w-12 text-center">{props.gap}px</span>
        </div>
      </div>
    </div>
  );
};