"use client";

import { useNode } from "@craftjs/core";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CraftImageProps } from "./types";
import React, { useRef } from "react";
import toast from "react-hot-toast";
// ⬇️ usa apiFetchImage en vez de apiFetch
import { apiFetchImage } from "@/lib/api";

export const ImageSettings = () => {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props as CraftImageProps,
  }));

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading("Subiendo imagen...");
    const formData = new FormData();
    formData.append("image", file);

    try {
      // ⬇️ llamada específica para multipart/form-data
      const response = await apiFetchImage("/upload/landing-image", formData);

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Error al subir la imagen.");
      }

      // Construcción segura de la URL final (evita dobles /)
      const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
      const path = String(result.url || "").replace(/^\/+/, "");
      const fullUrl = `${base}/${path}`;

      setProp((props: CraftImageProps) => (props.src = fullUrl));
      toast.success("Imagen subida con éxito", { id: toastId });
    } catch (error: any) {
      toast.error(error.message ?? "Error al subir la imagen", { id: toastId });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Fuente de la Imagen</Label>
        <div className="flex items-center gap-2">
          <Input
            id="src"
            value={props.src}
            onChange={(e) => setProp((props: CraftImageProps) => (props.src = e.target.value))}
            placeholder="https://ejemplo.com/imagen.jpg"
            className="flex-grow"
          />
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/png, image/jpeg, image/gif, image/webp"
          />
          <Button onClick={handleUploadClick} size="sm" variant="outline">
            Subir
          </Button>
        </div>
      </div>

      <div>
        <Label htmlFor="alt">Texto Alternativo</Label>
        <Input
          id="alt"
          value={props.alt}
          onChange={(e) => setProp((props: CraftImageProps) => (props.alt = e.target.value))}
        />
      </div>

      <div>
        <Label htmlFor="width">Ancho (%)</Label>
        <Input
          id="width"
          type="number"
          min="1"
          max="100"
          value={props.width}
          onChange={(e) => setProp((props: CraftImageProps) => (props.width = parseInt(e.target.value, 10)))}
        />
      </div>

      <div>
        <Label>Alineación</Label>
        <Select
          value={props.textAlign}
          onValueChange={(value) =>
            setProp((props: CraftImageProps) => (props.textAlign = value as CraftImageProps["textAlign"]))
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
        <Label htmlFor="linkHref">Enlace (Opcional)</Label>
        <Input
          id="linkHref"
          value={props.linkHref}
          onChange={(e) => setProp((props: CraftImageProps) => (props.linkHref = e.target.value))}
          placeholder="https://ejemplo.com"
        />
      </div>
    </div>
  );
};
