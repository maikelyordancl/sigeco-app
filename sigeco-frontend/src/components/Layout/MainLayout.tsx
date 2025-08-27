"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Toaster } from "react-hot-toast";
import Navbar from "../Navbar";
import { getRefreshToken } from "@/lib/auth";

interface MainLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function MainLayout({ children, title }: MainLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState(1); // Escala inicial (1 = 100%)

  const increaseFontSize = () => setFontSize(prev => Math.min(prev + 0.1, 1.5));
  const decreaseFontSize = () => setFontSize(prev => Math.max(prev - 0.1, 0.8));
  const resetFontSize = () => setFontSize(1);

  useEffect(() => {
    // Aplicamos el tamaño de fuente directamente al elemento <html>
    // Usamos 'rem' para que todos los elementos con 'rem' escalen
    document.documentElement.style.fontSize = `${fontSize * 16}px`;
  }, [fontSize]);


  useEffect(() => {
    if (pathname === "/login") {
      setIsAuthenticated(true);
      return;
    }

    const token = getRefreshToken();

    if (token) {
      setIsAuthenticated(true);
    } else {
      router.push("/login");
    }
  }, [router, pathname]);

  useEffect(() => {
    if (title) {
      document.title = `${title} | Sigeco`;
    } else {
      document.title = "Sigeco";
    }
  }, [title]);

  if (!isAuthenticated) {
    return null;
  }

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar
        fontSize={fontSize} // Pasamos el valor actual
        increaseFontSize={increaseFontSize}
        decreaseFontSize={decreaseFontSize}
        resetFontSize={resetFontSize}
      />
      <main className="p-6">
        {children}
      </main>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            fontSize: '1.25rem',
            padding: '20px',
            borderRadius: '10px',
            minWidth: '300px',
          },
        }}
        reverseOrder={false}
      />
    </div>
  );
}