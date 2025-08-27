"use client";

import { Editor, Frame, Element } from "@craftjs/core";
import { CraftContainer } from "./CraftContainer";
import { CraftText } from "./CraftText";
import { Toolbox } from "./Toolbox";
import { SettingsPanel } from "./SettingsPanel";
import { CraftColumns } from "./CraftColumns";

export const LandingPageEditor = () => {
  return (
    <div className="min-h-[70vh] w-full border rounded-lg">
      <Editor
        resolver={{ CraftContainer, CraftText, CraftColumns }}
      >
        <div className="grid grid-cols-12 h-full">
          <div className="col-span-2 bg-card p-2 border-r">
            <Toolbox />
          </div>
          
          <div className="col-span-8 bg-gray-50 dark:bg-gray-800 p-4 overflow-auto">
            <Frame>
              <Element is={CraftContainer} canvas>
                <CraftText
                  text="¡Edita este título!"
                  fontSize={28}
                  textAlign="left"
                  fontWeight="bold"
                  color="#000000"
                  margin={["0", "0", "8", "0"]}
                  fontFamily="Roboto"
                />
                <CraftText
                  text="Arrastra más componentes desde la barra de la izquierda."
                  fontSize={16}
                  textAlign="left"
                  fontWeight="normal"
                  color="#000000"
                  margin={["0", "0", "8", "0"]}
                  fontFamily="Roboto"
                />
              </Element>
            </Frame>
          </div>

          <div className="col-span-2 bg-card p-2 border-l">
            <SettingsPanel />
          </div>
        </div>
      </Editor>
    </div>
  );
};