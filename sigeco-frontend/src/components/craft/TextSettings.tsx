"use client";

import { useNode } from "@craftjs/core";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CraftTextProps } from "./types";
import { fonts, fontList, systemFonts } from "@/app/fonts"; 
import { cn } from "@/lib/utils";

export const TextSettings = () => {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props as CraftTextProps,
  }));

  const handleFontSizeChange = (value: string) => {
    const numericValue = parseInt(value, 10);
    setProp((props: CraftTextProps) => {
      props.fontSize = isNaN(numericValue) ? 0 : numericValue;
    }, 500);
  };

  const handleMarginChange = (value: string, index: number) => {
    const newMargin = [...props.margin];
    newMargin[index] = value;
    setProp((props: CraftTextProps) => {
      props.margin = newMargin as [string, string, string, string];
    }, 500);
  };
  
  const getTriggerStyle = () => {
      const googleFont = fonts[props.fontFamily as keyof typeof fonts];
      if (googleFont) return { fontFamily: `var(${googleFont.variable})`};
      
      const systemFont = systemFonts.find((f: { name: string; }) => f.name === props.fontFamily);
      if (systemFont) return { fontFamily: systemFont.family };
      
      return {};
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Fuente</Label>
        <Select
          value={props.fontFamily}
          onValueChange={(value) =>
            setProp((props: CraftTextProps) => (props.fontFamily = value))
          }
        >
          <SelectTrigger style={getTriggerStyle()}>
            <SelectValue>
              {props.fontFamily}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {fontList.map((fontName) => {
              const googleFont = fonts[fontName as keyof typeof fonts];
              const systemFont = systemFonts.find((f: { name: string; }) => f.name === fontName);
              
              return (
                <SelectItem
                  key={fontName}
                  value={fontName}
                  className={cn(googleFont?.className)}
                  style={systemFont ? { fontFamily: systemFont.family } : {}}
                >
                  {fontName}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="text-content">Contenido</Label>
        <textarea
          id="text-content"
          value={props.text}
          onChange={(e) =>
            setProp((props: CraftTextProps) => (props.text = e.target.value))
          }
          className="w-full p-2 border rounded-md"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 items-end">
        <div>
          <Label htmlFor="font-size">Tamaño</Label>
          <Input
              id="font-size"
              type="number"
              min="1"
              value={props.fontSize || 0}
              onChange={(e) => handleFontSizeChange(e.target.value)}
          />
        </div>
        <div>
           <Label htmlFor="color">Color</Label>
           <Input
                id="color"
                type="color"
                value={props.color}
                onChange={(e) => setProp((props: CraftTextProps) => (props.color = e.target.value))}
                className="w-full h-9 p-1"
            />
        </div>
      </div>
      
      {/* --- INICIO DE LA CORRECCIÓN --- */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Alineación</Label>
          <Select
            value={props.textAlign}
            onValueChange={(value) =>
              setProp((props: CraftTextProps) => (props.textAlign = value as CraftTextProps['textAlign']))
            }
          >
            <SelectTrigger>
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Izquierda</SelectItem>
              <SelectItem value="center">Centro</SelectItem>
              <SelectItem value="right">Derecha</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Peso</Label>
          <Select
            value={props.fontWeight}
            onValueChange={(value) =>
              setProp((props: CraftTextProps) => (props.fontWeight = value as CraftTextProps['fontWeight']))
            }
          >
            <SelectTrigger>
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="bold">Negrita</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {/* --- FIN DE LA CORRECCIÓN --- */}

      <div>
        <Label>Márgenes (px)</Label>
        <div className="grid grid-cols-4 gap-1 text-center text-xs">
          <Label>Sup</Label>
          <Label>Der</Label>
          <Label>Inf</Label>
          <Label>Izq</Label>
          <Input type="number" value={props.margin[0] || 0} onChange={e => handleMarginChange(e.target.value, 0)} />
          <Input type="number" value={props.margin[1] || 0} onChange={e => handleMarginChange(e.target.value, 1)} />
          <Input type="number" value={props.margin[2] || 0} onChange={e => handleMarginChange(e.target.value, 2)} />
          <Input type="number" value={props.margin[3] || 0} onChange={e => handleMarginChange(e.target.value, 3)} />
        </div>
      </div>
    </div>
  );
};