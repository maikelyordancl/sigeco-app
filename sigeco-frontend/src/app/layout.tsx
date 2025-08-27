import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { Toaster } from "react-hot-toast";
import { fonts } from './fonts'; // Mantenemos la importación

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sigeco",
  description: "Sistema de Gestión de Eventos y Contactos",
};

// --- CORRECCIÓN ---
// En lugar de acceder a .variable, usamos .className.
const fontClasses = Object.values(fonts).map(font => font.className).join(' ');
// --- FIN DE LA CORRECCIÓN ---

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        // Aplicamos todas las clases de las fuentes aquí
        className={`${geistSans.variable} ${geistMono.variable} ${fontClasses} antialiased`}
      >
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#333',
              color: '#fff',
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}