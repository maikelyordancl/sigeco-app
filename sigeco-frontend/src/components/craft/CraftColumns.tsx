"use client";

import { useNode, Element } from "@craftjs/core";
import { CraftContainer } from "./CraftContainer";
import { ColumnsSettings } from "./ColumnsSettings";

export type CraftColumnsProps = {
  columnCount: number;
  distribution: "even" | "left-heavy" | "right-heavy";
  gap: number;
};

export const CraftColumns = ({ columnCount, distribution, gap }: CraftColumnsProps) => {
  const {
    connectors: { connect, drag },
  } = useNode();

  const getColumnClasses = () => {
    if (columnCount === 2) {
      if (distribution === "left-heavy") return ["w-2/3", "w-1/3"];
      if (distribution === "right-heavy") return ["w-1/3", "w-2/3"];
      return ["w-1/2", "w-1/2"];
    }
    if (columnCount === 3) {
      return ["w-1/3", "w-1/3", "w-1/3"];
    }
    return [];
  };

  const columnClasses = getColumnClasses();

  return (
    <div
      ref={(ref: HTMLDivElement | null) => {
        if (ref) connect(drag(ref));
      }}
      className="flex"
      style={{ gap: `${gap}px` }}
    >
      {Array.from({ length: columnCount }).map((_, index) => (
        <div key={index} className={columnClasses[index]}>
          <Element
            is={CraftContainer}
            id={`column-${index}`}
            canvas
          />
        </div>
      ))}
    </div>
  );
};

CraftColumns.craft = {
  props: {
    columnCount: 2,
    distribution: "even",
    gap: 16,
  } as CraftColumnsProps, 
  related: {
    settings: ColumnsSettings,
  },
  displayName: "Columnas",
};