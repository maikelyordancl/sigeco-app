import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UsuariosTable } from "./components/UsuariosTable";


export default function UsuariosRolesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Gestión de Usuarios y Roles</h1>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          <UsuariosTable />
        </CardContent>
      </Card>
    </div>
  );
}