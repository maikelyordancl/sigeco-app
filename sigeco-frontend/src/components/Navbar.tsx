"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Menu } from "lucide-react";

// Definir los submenús permitidos
type MenuType = "contactos" | "eventos" | "difusion";

export default function Navbar() {
  const router = useRouter();
  const [openMenu, setOpenMenu] = useState<MenuType | null>(null);

  const handleToggle = (menu: MenuType) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <nav className="bg-blue-600 text-white px-4 py-3 flex justify-between items-center shadow-md sticky top-0 z-50">
      {/* Logo */}
      <div className="text-2xl font-bold cursor-pointer" onClick={() => router.push("/dashboard")}>SIGECO</div>

      {/* Menú para pantallas grandes */}
      <div className="hidden md:flex space-x-6 items-center">
        <Button variant="ghost" onClick={() => router.push("/dashboard")}>Inicio</Button>

        {/* Submenú Eventos */}
        <div className="relative">
          <Button
            variant="ghost"
            className="flex items-center space-x-1"
            onClick={() => handleToggle("eventos")}
          >
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
          <Button
            variant="ghost"
            className="flex items-center space-x-1"
            onClick={() => handleToggle("contactos")}
          >
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
        <Button variant="ghost" onClick={() => router.push("/dashboard/convocatoria")}>Convocatoria</Button>

        {/* Submenú Difusión */}
        <div className="relative">
          <Button
            variant="ghost"
            className="flex items-center space-x-1"
            onClick={() => handleToggle("difusion")}
          >
            <span>Difusión</span>
            {openMenu === "difusion" ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </Button>
          {openMenu === "difusion" && (
            <div className="absolute bg-white text-black shadow-lg rounded mt-2 p-2 space-y-2 animate-fade-in">
              <Button variant="ghost" className="w-full justify-start" onClick={() => router.push("/dashboard/difusion/redes-sociales")}>Redes Sociales</Button>
              <Button variant="ghost" className="w-full justify-start" onClick={() => router.push("/dashboard/difusion/influencers")}>Influencers</Button>
              <Button variant="ghost" className="w-full justify-start" onClick={() => router.push("/dashboard/difusion/whatsapp")}>WhatsApp</Button>
            </div>
          )}
        </div>

        <Button variant="ghost" onClick={() => router.push("/dashboard/acreditacion")}>Acreditación</Button>
        <Button variant="ghost" onClick={() => router.push("/dashboard/reportes")}>Reportes</Button>
        <Button variant="destructive" onClick={handleLogout}>Cerrar Sesión</Button>
      </div>

      {/* Menú hamburguesa para pantallas pequeñas */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost">
              <Menu size={24} />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="bg-blue-600 text-white w-64">
            <Accordion type="single" collapsible className="w-full mt-4 space-y-2">
              <Button variant="ghost" className="w-full justify-start" onClick={() => router.push("/dashboard")}>Inicio</Button>

              {/* Presupuesto Submenú */}
              <AccordionItem value="presupuesto">
                <AccordionTrigger className="text-left">Presupuesto</AccordionTrigger>
                <AccordionContent>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => router.push("/dashboard/presupuesto/proyectos")}>Proyectos</Button>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => router.push("/dashboard/presupuesto/educacion")}>Educación</Button>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => router.push("/dashboard/presupuesto/congresos")}>Congresos y Ferias</Button>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => router.push("/dashboard/presupuesto/servicios")}>Servicios</Button>
                </AccordionContent>
              </AccordionItem>

              {/* Eventos Submenú */}
              <AccordionItem value="eventos">
                <AccordionTrigger className="text-left">Eventos</AccordionTrigger>
                <AccordionContent>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => router.push("/dashboard/eventos/gestion")}>Gestión de Eventos</Button>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => router.push("/dashboard/eventos/subeventos")}>Subeventos</Button>
                </AccordionContent>
              </AccordionItem>

              <Button variant="ghost" className="w-full justify-start" onClick={() => router.push("/dashboard/contactos")}>Contactos</Button>
              <Button variant="ghost" className="w-full justify-start" onClick={() => router.push("/dashboard/convocatoria")}>Convocatoria</Button>

              {/* Difusión Submenú */}
              <AccordionItem value="difusion">
                <AccordionTrigger className="text-left">Difusión</AccordionTrigger>
                <AccordionContent>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => router.push("/dashboard/difusion/redes-sociales")}>Redes Sociales</Button>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => router.push("/dashboard/difusion/influencers")}>Influencers</Button>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => router.push("/dashboard/difusion/whatsapp")}>WhatsApp</Button>
                </AccordionContent>
              </AccordionItem>

              <Button variant="ghost" className="w-full justify-start" onClick={() => router.push("/dashboard/acreditacion")}>Acreditación</Button>
              <Button variant="ghost" className="w-full justify-start" onClick={() => router.push("/dashboard/reportes")}>Reportes</Button>

              <Button variant="destructive" className="w-full justify-start mt-4" onClick={handleLogout}>Cerrar Sesión</Button>
            </Accordion>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}