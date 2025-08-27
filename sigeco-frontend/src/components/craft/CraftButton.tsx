"use client";

import { useNode, useEditor, EditorState } from "@craftjs/core";
import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CraftButtonProps } from "./types";
import { ButtonSettings } from "./ButtonSettings";

export const CraftButton = ({ text, variant, size, linkHref, textAlign }: CraftButtonProps) => {
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

  const buttonElement = (
    <Button
      variant={variant}
      size={size}
      onClick={() => {
        if (!enabled && linkHref) {
          window.location.href = linkHref;
        }
      }}
    >
      {text}
    </Button>
  );

  if (!enabled) {
    return <div style={{ textAlign }}>{buttonElement}</div>;
  }
  
  return (
    <div
      ref={(ref: HTMLDivElement) => { if (ref) connect(drag(ref)); }}
      style={{ textAlign }}
      onDoubleClick={() => editorActions.selectNode(id)}
      className={cn(
        "p-1",
        selected ? "outline-blue-500 outline-dashed outline-2" : ""
      )}
    >
      {buttonElement}
    </div>
  );
};

CraftButton.craft = {
  props: {
    text: "Click me",
    variant: "default",
    size: "default",
    linkHref: "#",
    textAlign: "center",
  } as CraftButtonProps, 
  related: {
    settings: ButtonSettings,
  },
  displayName: "Botón",
};