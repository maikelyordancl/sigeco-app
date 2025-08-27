"use client";

import { useState, useEffect, useCallback, ChangeEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "react-hot-toast";
import { apiFetch } from "@/lib/api";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { UploadCloud, FileText, Download, Trash2, Loader2, Image as ImageIcon, File as FileIcon, ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { Evento } from "@/app/eventos/gestion/types";
import { Label } from "@/components/ui/label";

interface Archivo {
    id_archivo: number;
    nombre_original: string;
    fecha_subida: string;
    tipo_mime: string;
}

interface GestionArchivosDialogProps {
    isOpen: boolean;
    onClose: () => void;
    evento: Evento | null;
}

export const GestionArchivosDialog = ({ isOpen, onClose, evento }: GestionArchivosDialogProps) => {
    const [archivos, setArchivos] = useState<Archivo[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [previewFile, setPreviewFile] = useState<Archivo | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    // --- CORRECCIÓN: Se elimina imagePreviewUrl del array de dependencias ---
    const fetchArchivos = useCallback(async () => {
        if (!evento?.id_evento) return;
        setLoading(true);
        setPreviewFile(null);
        try {
            const response = await apiFetch(`/eventos/${evento.id_evento}/archivos`);
            const result = await response.json();
            if (result.success) {
                setArchivos(result.data);
            } else {
                toast.error(result.error || "No se pudieron cargar los archivos.");
            }
        } catch (error) {
            toast.error("Error de red al cargar los archivos.");
        } finally {
            setLoading(false);
        }
    }, [evento]);
    // --- FIN DE LA CORRECCIÓN ---

    useEffect(() => {
        if (isOpen) {
            fetchArchivos();
        }
    }, [isOpen, fetchArchivos]);

    useEffect(() => {
        let objectUrl: string | null = null;

        if (previewFile && previewFile.tipo_mime.startsWith('image/')) {
            let isCancelled = false;

            const fetchImage = async () => {
                try {
                    const response = await apiFetch(`/eventos/archivos/${previewFile.id_archivo}/view`);
                    if (!isCancelled) {
                        if (!response.ok) throw new Error("No se pudo cargar la imagen.");
                        const blob = await response.blob();
                        objectUrl = URL.createObjectURL(blob);
                        setImagePreviewUrl(objectUrl);
                    }
                } catch (error) {
                    console.error("Error al cargar previsualización:", error);
                    toast.error("No se pudo cargar la imagen para previsualizar.");
                }
            };

            fetchImage();

            return () => {
                isCancelled = true;
                if (objectUrl) {
                    URL.revokeObjectURL(objectUrl);
                }
            };
        }
    }, [previewFile]);


    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        setSelectedFiles(e.target.files);
    };

    const handleUpload = async () => {
        if (!selectedFiles || selectedFiles.length === 0 || !evento?.id_evento) {
            toast.error("Por favor, selecciona al menos un archivo para subir.");
            return;
        }
        setUploading(true);
        const toastId = toast.loading(`Subiendo ${selectedFiles.length} archivo(s)...`);

        const formData = new FormData();
        for (let i = 0; i < selectedFiles.length; i++) {
            formData.append("archivos", selectedFiles[i]);
        }

        try {
            const response = await apiFetch(`/eventos/${evento.id_evento}/archivos`, {
                method: 'POST',
                body: formData,
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Error en la subida.");

            toast.success("Archivos subidos con éxito.", { id: toastId });
            setSelectedFiles(null);
            fetchArchivos();
        } catch (error: any) {
            toast.error(error.message, { id: toastId });
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = (id_archivo: number, nombre_original: string) => {
        toast.promise(
            apiFetch(`/eventos/archivos/${id_archivo}`)
                .then(response => {
                    if (!response.ok) throw new Error("No se pudo descargar el archivo.");
                    return response.blob();
                })
                .then(blob => {
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = nombre_original;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    window.URL.revokeObjectURL(url);
                }),
            {
                loading: 'Descargando...',
                success: 'Archivo descargado.',
                error: 'Error al descargar.',
            }
        );
    };

    const handleDelete = async (id_archivo: number) => {
        if (!confirm("¿Estás seguro de que quieres eliminar este archivo? Esta acción no se puede deshacer.")) {
            return;
        }
        const toastId = toast.loading("Eliminando archivo...");
        try {
            const response = await apiFetch(`/eventos/archivos/${id_archivo}`, { method: 'DELETE' });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Error al eliminar.");

            toast.success("Archivo eliminado.", { id: toastId });
            fetchArchivos();
        } catch (error: any) {
            toast.error(error.message, { id: toastId });
        }
    };

    const renderPreview = () => {
        if (!previewFile) {
            return <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <FileIcon className="h-16 w-16 mb-2" />
                <p>Selecciona un archivo para previsualizar</p>
            </div>;
        }

        const previewUrl = `${API_URL}/eventos/archivos/${previewFile.id_archivo}/view`;

        if (previewFile.tipo_mime.startsWith('image/')) {
            return imagePreviewUrl
                ? (
                    <TransformWrapper initialScale={1} minScale={0.5} maxScale={5} limitToBounds={false} centerOnInit={true}>
                        {({ zoomIn, zoomOut, resetTransform }) => (
                            <>
                                <div className="flex justify-center gap-2 mb-2">
                                    <Button size="sm" variant="outline" onClick={() => zoomIn()}>
                                        <ZoomIn className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => zoomOut()}>
                                        <ZoomOut className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => resetTransform()}>
                                        <Maximize className="h-4 w-4" />
                                    </Button>
                                </div>
                                <TransformComponent
                                    wrapperStyle={{ width: "100%", height: "calc(100% - 40px)" }}
                                    contentStyle={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}
                                >
                                    <img
                                        src={imagePreviewUrl}
                                        alt={previewFile.nombre_original}
                                        className="max-w-full max-h-full object-contain"
                                        style={{ objectFit: 'contain' }}
                                    />
                                </TransformComponent>
                            </>
                        )}
                    </TransformWrapper>
                )
                : <Loader2 className="h-8 w-8 animate-spin" />;
        }

        if (previewFile.tipo_mime === 'application/pdf') {
            return <iframe src={previewUrl} className="h-full w-full" title={previewFile.nombre_original}></iframe>;
        }

        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <FileText className="h-16 w-16 mb-2" />
                <p className="font-semibold">{previewFile.nombre_original}</p>
                <p className="text-sm">No se puede previsualizar este tipo de archivo.</p>
                <Button size="sm" className="mt-4" onClick={() => handleDownload(previewFile.id_archivo, previewFile.nombre_original)}>
                    <Download className="mr-2 h-4 w-4" />
                    Descargar
                </Button>
            </div>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Gestionar Archivos del Evento</DialogTitle>
                    <DialogDescription className="text-lg font-medium text-gray-700">
                        Evento: {evento?.nombre}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 max-h-[70vh] overflow-y-auto">
                    {/* Columna Izquierda: Carga y Lista */}
                    <div className="space-y-4">
                        <div className="p-4 border-2 border-dashed rounded-md text-center">
                            <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                            <Label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500">
                                <span>Selecciona archivos para subir</span>
                                <Input id="file-upload" type="file" className="sr-only" multiple onChange={handleFileChange} />
                            </Label>
                            <p className="text-xs text-gray-500">o arrástralos y suéltalos aquí</p>
                            {selectedFiles && <p className="text-sm mt-2">{selectedFiles.length} archivo(s) seleccionado(s).</p>}
                        </div>
                        <Button onClick={handleUpload} disabled={uploading || !selectedFiles} className="w-full">
                            {uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Subiendo...</> : "Subir Archivos"}
                        </Button>

                        <div className="space-y-2">
                            <h4 className="font-semibold">Archivos existentes</h4>
                            <div className="border rounded-md max-h-60 overflow-y-auto">
                                {loading ? <p className="p-4 text-center">Cargando...</p> : (
                                    <Table>
                                        <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                                        <TableBody>
                                            {archivos.length > 0 ? archivos.map(archivo => (
                                                <TableRow key={archivo.id_archivo} onClick={() => setPreviewFile(archivo)} className="cursor-pointer hover:bg-gray-50">
                                                    <TableCell className="font-medium flex items-center gap-2"><FileText size={16} />{archivo.nombre_original}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDownload(archivo.id_archivo, archivo.nombre_original); }}>
                                                            <Download size={16} />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDelete(archivo.id_archivo); }}>
                                                            <Trash2 size={16} className="text-red-500" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            )) : (
                                                <TableRow><TableCell colSpan={2} className="text-center h-24">No hay archivos.</TableCell></TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Columna Derecha: Previsualización */}
                    <div>
                        <h4 className="font-semibold mb-2">Previsualización</h4>
                        <div className="border rounded-md h-[450px] flex flex-col items-center justify-center bg-gray-50 p-2">
                            {renderPreview()}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={onClose} variant="outline">Cerrar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};