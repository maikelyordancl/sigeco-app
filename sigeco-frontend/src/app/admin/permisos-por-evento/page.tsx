import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPermissionsList } from "./components/UserPermissionsList";

export default function PermisosPorEventoPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Gestión de Permisos por Evento</h1>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios</CardTitle>
          <p className="text-sm text-gray-500">
            Selecciona un usuario para administrar sus permisos de acceso a los eventos.
          </p>
        </CardHeader>
        <CardContent>
          <UserPermissionsList />
        </CardContent>
      </Card>
    </div>
  );
}