"use client";

import { useNode } from "@craftjs/core";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CraftVideoProps } from "./types";

export const VideoSettings = () => {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props as CraftVideoProps,
  }));

  return (
    <div className="space-y-4">
      <div>
        <Label>Fuente del Vídeo</Label>
        <Select
          value={props.source}
          onValueChange={(value) =>
            setProp((props: CraftVideoProps) => (props.source = value as CraftVideoProps['source']))
          }
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="youtube">YouTube</SelectItem>
            <SelectItem value="vimeo">Vimeo</SelectItem>
            <SelectItem value="url">URL Directa (.mp4)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="videoId">ID del Vídeo o URL</Label>
        <Input
          id="videoId"
          value={props.videoId}
          onChange={(e) => setProp((props: CraftVideoProps) => (props.videoId = e.target.value))}
          placeholder={props.source === 'url' ? 'https://ejemplo.com/video.mp4' : 'ID del vídeo'}
        />
      </div>

       <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
                <Label>Autoplay</Label>
                <p className="text-xs text-muted-foreground">
                    El vídeo intentará reproducirse automáticamente (puede estar bloqueado por el navegador).
                </p>
            </div>
            <Switch
                checked={props.autoplay}
                onCheckedChange={(checked) => setProp((props: CraftVideoProps) => (props.autoplay = checked))}
            />
        </div>
    </div>
  );
};