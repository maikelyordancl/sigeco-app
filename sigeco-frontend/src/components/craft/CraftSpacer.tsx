"use client";

import { useNode, useEditor } from "@craftjs/core";
import React from "react";
import { cn } from "@/lib/utils";
import { CraftSpacerProps } from "./types";
import { MoveVertical } from 'lucide-react';
import { SpacerSettings } from "./SpacerSettings";

export const CraftSpacer = ({ height, showLine }: CraftSpacerProps) => {
  const {
    connectors: { connect, drag },
    selected,
    id
  } = useNode(node => ({
    selected: node.events.selected
  }));

  const { enabled } = useEditor((state) => ({
    enabled: state.options.enabled,
  }));


  return (
    <div
      ref={(ref: HTMLDivElement) => { if (ref) connect(drag(ref)); }}
      style={{ height: `${height}px` }}
      className={cn(
        "w-full flex items-center justify-center transition-all",
        selected && enabled ? "bg-blue-100/50" : ""
      )}
    >
      {showLine && <div className="w-full h-px bg-gray-300"></div>}
      {selected && enabled && (
        <MoveVertical className="text-blue-500" size={16}/>
      )}
    </div>
  );
};

CraftSpacer.craft = {
  props: {
    height: 20,
    showLine: false,
  } as CraftSpacerProps, 
  related: {
    settings: SpacerSettings,
  },
  displayName: "Espaciador",
};