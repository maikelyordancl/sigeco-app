"use client";

import React, { useEffect, useState } from "react";
import { Resolver } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { Contacto } from "../types/contacto";
import { toast } from "react-hot-toast";

// 📌 Esquema de validación con Yup
const validationSchema = Yup.object().shape({
  id_contacto: Yup.number().optional(), // ID opcional
  nombre: Yup.string().required("El nombre es obligatorio."),
  apellido: Yup.string().required("El apellido es obligatorio."),
  email: Yup.string().email("Email inválido").required("El email es obligatorio."),
  telefono: Yup.string().required("El teléfono es obligatorio."),
  rut: Yup.string().required("El RUT es obligatorio."),
  empresa: Yup.string().nullable().optional(),
  actividad: Yup.string().nullable().optional(),
  profesion: Yup.string().nullable().optional(),
  pais: Yup.string().required("El país es obligatorio."),
  recibir_mail: Yup.boolean().optional(),
  fecha_creado: Yup.string().optional(), // Hacer opcionales
  fecha_modificado: Yup.string().optional(),
});


type ContactoFormProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  contacto?: Contacto | null;
  refreshContactos: () => void;
};

const ContactoForm: React.FC<ContactoFormProps> = ({ open, setOpen, contacto, refreshContactos }) => {
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Contacto>({
    resolver: yupResolver(validationSchema) as unknown as Resolver<Contacto>,
  });


  useEffect(() => {
    if (contacto) {
      reset(contacto);
    } else {
      reset({
        id_contacto: undefined,
        nombre: "",
        apellido: "",
        email: "",
        telefono: "",
        rut: "",
        empresa: "",
        actividad: "",
        profesion: "",
        pais: "",
        recibir_mail: false,
        fecha_creado: "",
        fecha_modificado: "",
      });
    }
  }, [contacto, reset]);


  const onSubmit = async (data: Contacto) => {
    setLoading(true);
    setErrorModal(null); // Limpia errores anteriores

    const token = localStorage.getItem("token");
    const isEditing = !!contacto;

    // La URL cambia según si estamos editando o creando
    const url = isEditing
      ? `${process.env.NEXT_PUBLIC_API_URL}/contactos/${contacto.id_contacto}`
      : `${process.env.NEXT_PUBLIC_API_URL}/contactos`;

    const metodo = isEditing ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method: metodo,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        setOpen(false);
        toast.success(isEditing ? "Contacto actualizado con éxito." : "Contacto agregado con éxito.");
        refreshContactos();
      } else {
        // Manejo de errores mejorado para el modal
        if (result.errors && Array.isArray(result.errors)) {
          // Une todos los mensajes de error en una sola cadena para el modal
          const errorMessages = result.errors.map((err: any) => err.msg).join(' \n');
          setErrorModal(errorMessages);
        } else {
          setErrorModal(result.error || "Error al guardar el contacto.");
        }
      }
    } catch (error) {
      setErrorModal("Error de red al intentar guardar el contacto.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{contacto ? "Editar Contacto" : "Agregar Contacto"}</DialogTitle>
        </DialogHeader>

        {errorModal && <div className="bg-red-100 text-red-700 p-3 rounded-md text-center">{errorModal}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input {...register("nombre")} placeholder="Nombre" />
          {errors.nombre && <p className="text-red-500">{errors.nombre.message}</p>}

          <Input {...register("apellido")} placeholder="Apellido" />
          {errors.apellido && <p className="text-red-500">{errors.apellido.message}</p>}

          <Input type="email" {...register("email")} placeholder="Email" />
          {errors.email && <p className="text-red-500">{errors.email.message}</p>}

          <Input {...register("telefono")} placeholder="Teléfono" />
          {errors.telefono && <p className="text-red-500">{errors.telefono.message}</p>}

          <Input {...register("rut")} placeholder="RUT" />
          {errors.rut && <p className="text-red-500">{errors.rut.message}</p>}

          <Input {...register("empresa")} placeholder="Empresa (Opcional)" />
          <Input {...register("actividad")} placeholder="Actividad (Opcional)" />
          <Input {...register("profesion")} placeholder="Profesión (Opcional)" />

          <Input {...register("pais")} placeholder="País" />
          {errors.pais && <p className="text-red-500">{errors.pais.message}</p>}

          <div className="flex items-center space-x-2">
            <input type="checkbox" {...register("recibir_mail")} id="recibir_mail" />
            <label htmlFor="recibir_mail">¿Desea recibir correos?</label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ContactoForm;
