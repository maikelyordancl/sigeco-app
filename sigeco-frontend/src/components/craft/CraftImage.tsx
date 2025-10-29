"use client";

import { useNode, useEditor, EditorState } from "@craftjs/core";
import React from "react";
import { cn } from "@/lib/utils";
import { CraftImageProps } from "./types";
import { ImageIcon } from "lucide-react";
import { ImageSettings } from "./ImageSettings";

export const CraftImage = ({ src, alt, width, height, textAlign, linkHref }: CraftImageProps) => {
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

  const imageElement = (
    <img
      src={src || '/placeholder.svg'} // Un placeholder si no hay imagen
      alt={alt}
      style={{
        width: `${width}%`,
        height: height > 0 ? `${height}px` : 'auto',
      }}
      className="object-cover"
    />
  );

  if (!enabled) {
    if (linkHref) {
      return (
        <a href={linkHref} target="_blank" rel="noopener noreferrer" style={{ textAlign }}>
          {imageElement}
        </a>
      );
    }
    return <div style={{ textAlign }}>{imageElement}</div>;
  }

  return (
    <div
      ref={(ref: HTMLDivElement) => { if (ref) connect(drag(ref)); }}
      onDoubleClick={() => editorActions.selectNode(id)}
      style={{ textAlign }}
      className={cn(
       // "p-1",
        selected
          ? "border-dashed border-2 border-blue-500"
          : "cursor-move"
      )}
    >
      {src ? (
        imageElement
      ) : (
        <div className="flex flex-col items-center justify-center bg-gray-100 text-gray-400 p-4 border-dashed border-2 rounded-md">
          <ImageIcon className="h-8 w-8 mb-2" />
          <span>Imagen</span>
        </div>
      )}
    </div>
  );
};

CraftImage.craft = {
  props: {
    src: "",
    alt: "Imagen de la campaña",
    width: 100,
    height: 0,
    textAlign: "center",
    linkHref: "",
  } as CraftImageProps, 
  related: {
    settings: ImageSettings,
  },
  displayName: "Imagen",
};