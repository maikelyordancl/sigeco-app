"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Menu, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getRefreshToken, clearTokens, getUserRole } from "@/lib/auth";

type MenuType = "contactos" | "eventos" | "difusion" | "convocatoria" | "admin";

interface NavbarProps {
  fontSize: number;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  resetFontSize: () => void;
}

export default function Navbar({ fontSize, increaseFontSize, decreaseFontSize, resetFontSize }: NavbarProps) {
  const router = useRouter();
  const [openMenu, setOpenMenu] = useState<MenuType | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const role = getUserRole();
    // Abre la consola del navegador (F12) para ver este mensaje.
    console.log("Rol de usuario detectado:", role); 
    setUserRole(role);
  }, []);

  const handleToggle = (menu: MenuType) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const handleLogout = async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
        try {
            await apiFetch('/auth/logout', {
                method: 'POST',
                body: JSON.stringify({ refreshToken }),
            });
        } catch (error) {
            console.error("Fallo al cerrar sesión en el servidor:", error);
        }
    }
    clearTokens();
    router.push("/login");
  };
  
  const formattedFontSize = `${Math.round(fontSize * 100)}%`;

  return (
    <nav className="bg-blue-600 text-white px-4 py-3 flex justify-between items-center shadow-md sticky top-0 z-50">
      <div className="text-2xl font-bold cursor-pointer" onClick={() => router.push("/dashboard")}>SIGECO</div>

      <div className="hidden md:flex space-x-6 items-center">
        <div className="flex items-center space-x-2">
          <span>Tamaño Fuente ({formattedFontSize})</span>
          <Button variant="ghost" size="icon" onClick={decreaseFontSize}><ZoomOut size={20} /></Button>
          <Button variant="ghost" size="icon" onClick={increaseFontSize}><ZoomIn size={20} /></Button>
          <Button variant="ghost" size="icon" onClick={resetFontSize}><RotateCcw size={20} /></Button>
        </div>
        <Button variant="ghost" onClick={() => router.push("/dashboard")}>Inicio</Button>

        {/* --- MENÚS EXISTENTES --- */}
        <div className="relative">
          <Button variant="ghost" className="flex items-center space-x-1" onClick={() => handleToggle("eventos")}>
            <span>Eventos</span>
            {openMenu === "eventos" ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </Button>
          {openMenu === "eventos" && (
            <div className="absolute bg-white text-black shadow-lg rounded mt-2 p-2 space-y-2 animate-fade-in">
              <Button variant="ghost" className="w-full justify-start" onClick={() => router.push("/eventos/gestion")}>Gestión de Eventos</Button>
              <Button variant="ghost" className="w-full justify-start" onClick={() => router.push("/subeventos/gestion")}>Subeventos</Button>
            </div>
          )}
        </div>

        <div className="relative">
          <Button variant="ghost" className="flex items-center space-x-1" onClick={() => handleToggle("contactos")}>
            <span>Contactos</span>
            {openMenu === "contactos" ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </Button>
          {openMenu === "contactos" && (
            <div className="absolute bg-white text-black shadow-lg rounded mt-2 p-2 space-y-2 animate-fade-in">
              <Button variant="ghost" className="w-full justify-start" onClick={() => router.push("/contactos/gestion")}>Gestión</Button>
              <Button variant="ghost" className="w-full justify-start" onClick={() => router.push("/contactos/base-datos")}>Bases de Datos</Button>
            </div>
          )}
        </div>

        <div className="relative">
          <Button variant="ghost" className="flex items-center space-x-1" onClick={() => handleToggle("convocatoria")}>
            <span>Convocatoria</span>
            {openMenu === "convocatoria" ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </Button>
          {openMenu === "convocatoria" && (
            <div className="absolute bg-white text-black shadow-lg rounded mt-2 p-2 space-y-2 animate-fade-in">
              <Button variant="ghost" className="w-full justify-start" onClick={() => router.push("/convocatoria/campanas")}>Campañas</Button>
              <Button variant="ghost" className="w-full justify-start" onClick={() => router.push("/dashboard/convocatoria/influencers")}>Influencers</Button>
              <Button variant="ghost" className="w-full justify-start" onClick={() => router.push("/dashboard/convocatoria/whatsapp")}>WhatsApp</Button>
            </div>
          )}
        </div>

        {/* --- INICIO: NUEVO MENÚ DE ADMINISTRACIÓN --- */}
        {userRole === 'SUPER_ADMIN' && (
          <div className="relative">
            <Button
              variant="ghost"
              className="flex items-center space-x-1"
              onClick={() => handleToggle("admin")}
            >
              <span>Administración</span>
              {openMenu === "admin" ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </Button>
            {openMenu === "admin" && (
              <div className="absolute bg-white text-black shadow-lg rounded mt-2 p-2 space-y-2 animate-fade-in">
                <Button variant="ghost" className="w-full justify-start" onClick={() => router.push("/admin/usuarios-y-roles")}>Usuarios y Roles</Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => router.push("/admin/permisos-por-evento")}>Permisos por Evento</Button>
              </div>
            )}
          </div>
        )}
        {/* --- FIN: NUEVO MENÚ DE ADMINISTRACIÓN --- */}

        <Button variant="ghost" onClick={() => router.push("/acreditacion")}>Acreditación</Button>
        <Button variant="ghost" onClick={() => router.push("/dashboard/reportes")}>Reportes</Button>
        <Button variant="destructive" onClick={handleLogout}>Cerrar Sesión</Button>
      </div>

      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost">
              <Menu size={24} />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="bg-blue-600 text-white w-64">
             <div className="flex items-center space-x-2 mt-4">
                <span>Fuente ({formattedFontSize})</span>
               <Button variant="ghost" size="icon" onClick={decreaseFontSize}><ZoomOut size={20} /></Button>
               <Button variant="ghost" size="icon" onClick={increaseFontSize}><ZoomIn size={20} /></Button>
               <Button variant="ghost" size="icon" onClick={resetFontSize}><RotateCcw size={20} /></Button>
             </div>
            <Accordion type="single" collapsible className="w-full mt-4 space-y-2">
              <Button variant="ghost" className="w-full justify-start" onClick={() => router.push("/dashboard")}>Inicio</Button>

              <AccordionItem value="presupuesto">
                <AccordionTrigger className="text-left">Presupuesto</AccordionTrigger>
                <AccordionContent>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => router.push("/dashboard/presupuesto/proyectos")}>Proyectos</Button>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => router.push("/dashboard/presupuesto/educacion")}>Educación</Button>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => router.push("/dashboard/presupuesto/congresos")}>Congresos y Ferias</Button>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => router.push("/dashboard/presupuesto/servicios")}>Servicios</Button>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="eventos">
                <AccordionTrigger className="text-left">Eventos</AccordionTrigger>
                <AccordionContent>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => router.push("/eventos/gestion")}>Gestión de Eventos</Button>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => router.push("/subeventos/gestion")}>Subeventos</Button>
                </AccordionContent>
              </AccordionItem>

              <Button variant="ghost" className="w-full justify-start" onClick={() => router.push("/dashboard/contactos")}>Contactos</Button>
              <Button variant="ghost" className="w-full justify-start" onClick={() => router.push("/dashboard/convocatoria")}>Convocatoria</Button>

              {/* --- INICIO: NUEVO MENÚ DE ADMINISTRACIÓN (MÓVIL) --- */}
              {userRole === 'SUPER_ADMIN' && (
                <AccordionItem value="admin">
                  <AccordionTrigger className="text-left">Administración</AccordionTrigger>
                  <AccordionContent>
                    <Button variant="ghost" className="w-full justify-start" onClick={() => router.push("/admin/usuarios-y-roles")}>Usuarios y Roles</Button>
                    <Button variant="ghost" className="w-full justify-start" onClick={() => router.push("/admin/permisos-por-evento")}>Permisos por Evento</Button>
                  </AccordionContent>
                </AccordionItem>
              )}
              {/* --- FIN: NUEVO MENÚ DE ADMINISTRACIÓN (MÓVIL) --- */}

              <Button variant="ghost" className="w-full justify-start" onClick={() => router.push("/acreditacion")}>Acreditación</Button>
              <Button variant="ghost" className="w-full justify-start" onClick={() => router.push("/dashboard/reportes")}>Reportes</Button>

              <Button variant="destructive" className="w-full justify-start mt-4" onClick={handleLogout}>Cerrar Sesión</Button>
            </Accordion>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}