"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Toaster, toast } from "react-hot-toast";
import Navbar from "../Navbar";

interface MainLayoutProps {
  children: ReactNode;
  title?: string;  // Agregamos la prop de título
}

// Función para decodificar el payload del JWT
const decodeToken = (token: string) => {
  try {
    const payload = token.split('.')[1];
    const decodedPayload = JSON.parse(atob(payload));
    return decodedPayload;
  } catch {
    return null; // Si no se puede decodificar el token, retornamos null
  }
};

export default function MainLayout({ children, title }: MainLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    // Excluir la página de login de la verificación
    if (pathname === "/login") {
      setIsAuthenticated(true);
      return;
    }

    if (token) {
      const decoded = decodeToken(token);

      if (decoded && decoded.exp) {
        const currentTime = Math.floor(Date.now() / 1000); // Tiempo actual en segundos

        if (decoded.exp > currentTime) {
          // El token es válido
          setIsAuthenticated(true);
        } else {
          // El token ha expirado
          toast.error("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
          localStorage.removeItem("token"); // Eliminar el token expirado
          router.push("/login");
        }
      } else {
        // Token mal formado
        toast.error("Token inválido. Por favor, inicia sesión nuevamente.");
        localStorage.removeItem("token");
        router.push("/login");
      }
    } else {
      // No hay token, redirigir al login
      router.push("/login");
    }
  }, [router, pathname]);

  // Cambiar el título de la pestaña cuando cambia la prop `title`
  useEffect(() => {
    if (title) {
      document.title = `${title} | Sigeco`;
    } else {
      document.title = "Sigeco"; // Título por defecto
    }
  }, [title]);

  // Mientras se verifica el estado de autenticación, no renderizar nada
  if (isAuthenticated === null) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="p-6">
        {children}
      </main>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            fontSize: '1.25rem',  // Tamaño de fuente más grande (text-xl)
            padding: '20px',      // Más espacio interno
            borderRadius: '10px', // Bordes más redondeados
            minWidth: '300px',    // Ancho mínimo más grande
          },
        }}
        reverseOrder={false}
      />
    </div>
  );
}
