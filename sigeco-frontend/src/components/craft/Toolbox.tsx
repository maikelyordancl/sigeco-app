"use client";

import { useEditor } from "@craftjs/core";
import { Button } from "../ui/button";
import { CraftContainer } from "./CraftContainer";
import { CraftText } from "./CraftText";
import { CraftImage } from "./CraftImage";
import { CraftVideo } from "./CraftVideo";
import { CraftButton } from "./CraftButton";
import { CraftSpacer } from "./CraftSpacer";
import { CraftColumns } from "./CraftColumns";

export const Toolbox = () => {
  const { connectors } = useEditor();

  return (
    <div className="p-4 border-r h-full flex flex-col gap-2">
      <h3 className="font-semibold text-lg mb-2">Arrastra un elemento</h3>  
      <Button
        ref={(ref) => {
          if (ref) connectors.create(ref, <CraftContainer {...CraftContainer.craft.props} />);
        }}
        variant="outline"
      >
        Contenedor
      </Button>
      <Button
        ref={(ref) => {
          if (ref) connectors.create(ref, <CraftColumns {...CraftColumns.craft.props} />);
        }}
        variant="outline"
      >
        Columnas
      </Button>
      <Button
        ref={(ref) => {
          if (ref) connectors.create(ref, <CraftText {...CraftText.craft.props} />);
        }}
        variant="outline"
      >
        Texto
      </Button>
      <Button
        ref={(ref) => {
          if (ref) connectors.create(ref, <CraftImage {...CraftImage.craft.props} />);
        }}
        variant="outline"
      >
        Imagen
      </Button>
      <Button
        ref={(ref) => {
          if (ref) connectors.create(ref, <CraftVideo {...CraftVideo.craft.props} />);
        }}
        variant="outline"
      >
        Vídeo
      </Button>
      <Button
        ref={(ref) => {
          if (ref) connectors.create(ref, <CraftButton {...CraftButton.craft.props} />);
        }}
        variant="outline"
      >
        Botón
      </Button>
      <Button
        ref={(ref) => {
          if (ref) connectors.create(ref, <CraftSpacer {...CraftSpacer.craft.props} />);
        }}
        variant="outline"
      >
        Espaciador
      </Button>
    </div>
  );
};