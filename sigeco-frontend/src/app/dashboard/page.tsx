"use client";

import { Card, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";

const eventosMes = [
  { nombre: "Enero", cantidad: 3 },
  { nombre: "Febrero", cantidad: 5 },
  { nombre: "Marzo", cantidad: 2 },
  { nombre: "Abril", cantidad: 4 },
  { nombre: "Mayo", cantidad: 6 },
  { nombre: "Junio", cantidad: 3 },
];

const eventosAnuales = [
  { mes: "Enero", eventos: 3 },
  { mes: "Febrero", eventos: 5 },
  { mes: "Marzo", eventos: 8 },
  { mes: "Abril", eventos: 4 },
  { mes: "Mayo", eventos: 7 },
  { mes: "Junio", eventos: 6 },
  { mes: "Julio", eventos: 9 },
  { mes: "Agosto", eventos: 2 },
  { mes: "Septiembre", eventos: 4 },
  { mes: "Octubre", eventos: 5 },
  { mes: "Noviembre", eventos: 3 },
  { mes: "Diciembre", eventos: 6 },
];

export default function DashboardPage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Gráfico de Eventos del Mes */}
      <Card>
        <CardContent className="p-4">
          <h2 className="text-xl font-bold mb-4">Eventos del Mes</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={eventosMes}>
              <XAxis dataKey="nombre" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="cantidad" fill="#3182CE" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Eventos por Año */}
      <Card>
        <CardContent className="p-4">
          <h2 className="text-xl font-bold mb-4">Eventos por Año</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={eventosAnuales}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="eventos" stroke="#3182CE" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
