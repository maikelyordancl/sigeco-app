export type CraftTextProps = {
  text: string;
  fontSize: number;
  textAlign: "left" | "center" | "right";
  fontWeight: "normal" | "bold";
  color: string;
  margin: [string, string, string, string];
  fontFamily: string;
};

// --- NUEVO ---
export type CraftImageProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  textAlign: "left" | "center" | "right";
  linkHref?: string;
};

// --- NUEVO ---
export type CraftVideoProps = {
  source: "youtube" | "vimeo" | "url";
  videoId: string; // O la URL completa si el source es 'url'
  autoplay: boolean;
};

// --- NUEVO ---
export type CraftButtonProps = {
  text: string;
  variant: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size: "default" | "sm" | "lg" | "icon";
  linkHref: string;
  textAlign: "left" | "center" | "right";
};

// --- NUEVO ---
export type CraftSpacerProps = {
    height: number;
    showLine: boolean;
};