"use client";

import { useNode } from "@craftjs/core";
import { cn } from "@/lib/utils";
import React from "react";

type CraftContainerProps = {
  children?: React.ReactNode;
  className?: string;
  padding?: number;
};

export const CraftContainer = ({ children, className, padding = 0 }: CraftContainerProps) => {
  const {
    connectors: { connect, drag },
  } = useNode();

  return (
    <div
      ref={(ref: HTMLDivElement | null) => { if (ref) connect(drag(ref)); }}
      className={cn("p-0 flex-grow min-h-[50px]", className)}
      style={{ padding:0}}
    >
      {React.Children.count(children) > 0 ? (
        children
      ) : (
        /*<div className="text-center text-gray-400 p-8 border-dashed border-2 rounded-md">
          Arrastra un componente aquí dentro
        </div>
        */
        <div className="hidden" />
      )}
    </div>
  );
};

CraftContainer.craft = {
  props: {
    padding: 8,
  },
  isCanvas: true,
  displayName: "Contenedor",
};