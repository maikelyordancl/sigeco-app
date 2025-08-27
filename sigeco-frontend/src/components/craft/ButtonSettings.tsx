"use client";

import { useNode } from "@craftjs/core";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CraftButtonProps } from "./types";

export const ButtonSettings = () => {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props as CraftButtonProps,
  }));

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="text">Texto del Botón</Label>
        <Input
          id="text"
          value={props.text}
          onChange={(e) => setProp((props: CraftButtonProps) => (props.text = e.target.value), 500)}
        />
      </div>
      <div>
        <Label htmlFor="linkHref">Enlace (URL)</Label>
        <Input
          id="linkHref"
          value={props.linkHref}
          onChange={(e) => setProp((props: CraftButtonProps) => (props.linkHref = e.target.value), 500)}
        />
      </div>
      <div>
        <Label>Estilo</Label>
        <Select
          value={props.variant}
          onValueChange={(value) => setProp((props: CraftButtonProps) => (props.variant = value as CraftButtonProps['variant']))}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Primario</SelectItem>
            <SelectItem value="secondary">Secundario</SelectItem>
            <SelectItem value="destructive">Destructivo</SelectItem>
            <SelectItem value="outline">Contorno</SelectItem>
            <SelectItem value="ghost">Fantasma</SelectItem>
            <SelectItem value="link">Enlace</SelectItem>
          </SelectContent>
        </Select>
      </div>
       <div>
        <Label>Alineación</Label>
        <Select
          value={props.textAlign}
          onValueChange={(value) => setProp((props: CraftButtonProps) => (props.textAlign = value as CraftButtonProps['textAlign']))}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Izquierda</SelectItem>
            <SelectItem value="center">Centro</SelectItem>
            <SelectItem value="right">Derecha</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};