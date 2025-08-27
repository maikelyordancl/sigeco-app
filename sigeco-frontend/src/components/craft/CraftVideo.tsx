"use client";

import { useNode, useEditor, EditorState } from "@craftjs/core";
import React from "react";
import { cn } from "@/lib/utils";
import { CraftVideoProps } from "./types";
import { Youtube, Video, Pencil } from "lucide-react"; // Importar Pencil
import { VideoSettings } from "./VideoSettings";

const VideoPlaceholder = () => (
  <div className="flex flex-col items-center justify-center bg-gray-100 text-gray-400 p-4 border-dashed border-2 rounded-md h-full min-h-[150px]">
    <Video className="h-8 w-8 mb-2" />
    <span>Vídeo</span>
  </div>
);

export const CraftVideo = ({ source, videoId, autoplay }: CraftVideoProps) => {
  const {
    connectors: { connect, drag },
    selected,
    id,
  } = useNode((node) => ({
    selected: node.events.selected,
    id: node.id,
  }));

  const { actions: editorActions, enabled } = useEditor((state: EditorState) => ({
    enabled: state.options.enabled,
  }));

  const getEmbedUrl = () => {
    if (!videoId) return null;
    switch (source) {
      case "youtube":
        return `https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&mute=1&controls=${enabled ? 0 : 1}`;
      case "vimeo":
        return `https://player.vimeo.com/video/${videoId}?autoplay=${autoplay ? 1 : 0}&muted=1&controls=${enabled ? 0 : 1}`;
      case "url":
        return videoId;
      default:
        return null;
    }
  };

  const embedUrl = getEmbedUrl();

  const renderVideo = () => {
    if (!embedUrl) return <VideoPlaceholder />;
    if (source === 'url') {
      return (
        <video
          controls={!enabled} // Deshabilitamos controles en modo edición
          autoPlay={autoplay && !enabled}
          muted={autoplay || enabled}
          src={embedUrl}
          className="w-full aspect-video pointer-events-none" // Prevenimos interacción directa en modo edición
        />
      );
    }
    return (
      <iframe
        src={embedUrl}
        frameBorder="0"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        className="w-full aspect-video pointer-events-none" // La clave para evitar que el iframe capture clics
      ></iframe>
    );
  };

  return (
    // Contenedor principal relativo para posicionar la capa de edición
    <div
      className={cn(
        "relative",
        selected && enabled ? "outline-blue-500 outline-dashed outline-2 outline-offset-2" : ""
      )}
    >
      {renderVideo()}

      {/* --- INICIO DE LA SOLUCIÓN: Capa de Edición --- */}
      {enabled && (
        <div
          ref={(ref: HTMLDivElement) => { if (ref) connect(drag(ref)); }}
          className="absolute top-0 left-0 w-full h-full cursor-move opacity-20 hover:opacity-100 transition-opacity duration-300"
          onDoubleClick={() => editorActions.selectNode(id)}
        >
          <div className="absolute top-2 right-2 flex items-center bg-white/80 backdrop-blur-sm rounded-md shadow-md p-1 pointer-events-auto">
             <Pencil className="h-5 w-5 text-blue-600" />
          </div>
        </div>
      )}
      {/* --- FIN DE LA SOLUCIÓN --- */}
    </div>
  );
};

// La configuración estática no cambia
CraftVideo.craft = {
  props: {
    source: "youtube",
    videoId: "dQw4w9WgXcQ",
    autoplay: false,
  } as CraftVideoProps, 
  related: {
    settings: VideoSettings,
  },
  displayName: "Vídeo",
};