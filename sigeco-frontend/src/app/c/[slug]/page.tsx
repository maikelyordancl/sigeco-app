"use client";


export const dynamic = "force-dynamic";


import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LandingPagePresenter } from "./LandingPagePresenter";
import type { LandingPageProps } from "./types";


export default function PublicCampaignPage() {
    const [slug, setSlug] = useState<string | null>(null);
    const [data, setData] = useState<LandingPageProps["data"]>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);


    // Resolver slug desde la URL
    useEffect(() => {
        try {
            const parts = window.location.pathname.split("/").filter(Boolean);
            const last = parts.pop();
            if (!last) throw new Error("No se pudo determinar la campaña desde la URL.");
            setSlug(last);
        } catch (e: any) {
            setError(e.message || "Error al leer la URL.");
            setLoading(false);
        }
    }, []);


    // Cargar datos de la campaña
    useEffect(() => {
        if (!slug) return;
        let active = true;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/campana/${slug}`);
                const json = await resp.json();
                if (!resp.ok || !json.success) throw new Error(json.message || "No se pudo cargar la información.");
                if (active) setData(json.data as LandingPageProps["data"]);
            } catch (err: any) {
                if (active) setError(err.message || "Error inesperado");
            } finally {
                if (active) setLoading(false);
            }
        })();
        return () => {
            active = false;
        };
    }, [slug]);


    if (loading)
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p>Cargando campaña...</p>
            </div>
        );


    if (error)
        return (
            <div className="flex flex-col justify-center items-center min-h-screen bg-red-50 text-red-700">
                <AlertTriangle className="h-16 w-16 mb-4" />
                <h1 className="text-2xl font-bold">Ocurrió un error</h1>
                <p className="max-w-xl text-center">{error}</p>
                <Button onClick={() => (window.location.href = "/")} className="mt-6">
                    Volver al inicio
                </Button>
            </div>
        );


    if (!data)
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p>No se encontró la campaña.</p>
            </div>
        );


    // Delegamos el render a las plantillas a través del Presenter
    return <LandingPagePresenter data={data} />;
}