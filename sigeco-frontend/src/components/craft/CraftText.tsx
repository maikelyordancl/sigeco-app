"use client";

import { useNode, useEditor, EditorState } from "@craftjs/core";
import React from "react";
import ContentEditable from "react-contenteditable";
import { TextSettings } from "./TextSettings";
import { cn } from "@/lib/utils";
import { CraftTextProps } from "./types";
import { fonts, systemFonts } from "@/app/fonts"; // Importamos ambas listas

export const CraftText = ({
  text,
  fontSize,
  textAlign,
  fontWeight,
  color,
  margin,
  fontFamily,
}: CraftTextProps) => {
  const {
    connectors: { connect, drag },
    actions: { setProp },
    selected,
    id,
  } = useNode((node) => ({
    selected: node.events.selected,
    id: node.id,
  }));

  const { actions: editorActions, enabled } = useEditor((state: EditorState) => ({
    enabled: state.options.enabled,
  }));

  // --- INICIO DE LA MODIFICACIÓN ---
  // Lógica para determinar el estilo de la fuente
  const getFontFamilyStyle = () => {
    const googleFont = fonts[fontFamily as keyof typeof fonts];
    if (googleFont) {
      // Si es una Google Font, usamos su objeto de estilo directamente.
      // Esto soluciona el bug del iframe.
      return googleFont.style.fontFamily;
    }

    const systemFont = systemFonts.find((f: { name: string; }) => f.name === fontFamily);
    if (systemFont) {
      // Si es una fuente del sistema, usamos su nombre de familia CSS.
      return systemFont.family;
    }

    // Fallback por si acaso
    return 'Arial, sans-serif';
  };

  const textStyles: React.CSSProperties = {
    fontFamily: getFontFamilyStyle(), // Aplicamos la fuente correcta
    fontSize: `${fontSize}px`,
    textAlign,
    fontWeight,
    color,
    margin: `${margin[0]}px ${margin[1]}px ${margin[2]}px ${margin[3]}px`,
    lineHeight: 1.3,
  };
  // --- FIN DE LA MODIFICACIÓN ---

  if (!enabled) {
    return (
      <div
        style={textStyles}
        className="w-full"
        dangerouslySetInnerHTML={{ __html: text }}
      />
    );
  }

  return (
    <ContentEditable
      innerRef={(ref: HTMLElement) => { if(ref) connect(drag(ref)); }}
      html={text}
      disabled={!selected}
      onChange={(e) => {
        setProp((props: CraftTextProps) => (props.text = e.target.value), 500);
      }}
      onDoubleClick={() => editorActions.selectNode(id)}
      style={textStyles}
      className={cn(
        "w-full p-0.5",
        selected
          ? "border-dashed border-2 border-blue-500 cursor-text"
          : "cursor-move"
      )}
    />
  );
};

CraftText.craft = {
  props: {
    text: "Texto de ejemplo",
    fontSize: 16,
    textAlign: "left",
    fontWeight: "normal",
    color: "#000000",
    margin: ["0", "0", "8", "0"],
    fontFamily: "Roboto",
  } as CraftTextProps, 
  related: {
    settings: TextSettings,
  },
  displayName: "Texto",
};