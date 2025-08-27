"use client";

import { useEditor } from "@craftjs/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";
import { Button } from "../ui/button";
import { Trash2 } from "lucide-react";

export const SettingsPanel = () => {
  const { actions, selected, isDeletable } = useEditor((state, query) => {
    const [selectedId] = state.events.selected;
    let selectedNode;

    if (selectedId) {
      selectedNode = {
        id: selectedId,
        name: state.nodes[selectedId].data.displayName,
        settings:
          state.nodes[selectedId].related &&
          state.nodes[selectedId].related.settings,
      };
    }

    return {
      selected: selectedNode,
      isDeletable: selectedId ? query.node(selectedId).isDeletable() : false,
    };
  });

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Propiedades</CardTitle>
      </CardHeader>
      <CardContent>
        {selected && selected.settings ? (
          <div>
            {React.createElement(selected.settings)}
            {isDeletable && (
              <Button
                variant="destructive"
                className="mt-6 w-full"
                onClick={() => {
                  if(selected.id) {
                    actions.delete(selected.id);
                  }
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar Componente
              </Button>
            )}
          </div>
        ) : (
          <div className="text-center text-sm text-muted-foreground pt-4">
            <p>Selecciona un componente para editar sus propiedades.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};