'use client';
import React, { useState, useEffect } from 'react';
import { LandingPageProps } from './types';
import ClasicaLayout from './plantillas/ClasicaLayout';
import ModernaLayout from './plantillas/ModernaLayout';

// La palabra "export" aquí es la que soluciona el problema.
export const LandingPagePresenter: React.FC<LandingPageProps> = ({ data }) => {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return <div className="flex justify-center items-center h-screen">Cargando...</div>;
    }

    if (!data) {
        return <div className="text-center p-8">Cargando datos de la campaña...</div>;
    }

    const { campana } = data;

    if (campana.id_plantilla === 2) {
        return <ModernaLayout data={data} />;
    }
    
    // La plantilla Clásica será la opción por defecto
    return <ClasicaLayout data={data} />;
};

export default LandingPagePresenter;