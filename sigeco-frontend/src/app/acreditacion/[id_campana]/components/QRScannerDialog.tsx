// sigeco-frontend/src/app/acreditacion/[id_campana]/components/QRScannerDialog.tsx
"use client";

import { useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";

interface QRScannerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (data: string) => void;
}

// ID único para el elemento donde se montará la cámara
const qrReaderId = "qr-reader-element";

export function QRScannerDialog({
  isOpen,
  onClose,
  onScan,
}: QRScannerDialogProps) {
  // Usamos useRef para mantener la instancia del escáner
  const qrScannerRef = useRef<Html5Qrcode | null>(null);
  // Flag para evitar doble escaneo
  const scanSuccessRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      // Si el diálogo se abre, inicializamos y encendemos la cámara
      scanSuccessRef.current = false; // Reseteamos el flag
      
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        supportedScanTypes: [], // Dejar vacío usa todos los tipos
      };

      const onScanSuccess = (decodedText: string) => {
        // Al escanear con éxito, evitamos que siga escaneando
        if (!scanSuccessRef.current) {
          scanSuccessRef.current = true;
          onScan(decodedText);
          onClose();
        }
      };

      // Creamos la instancia
      const html5QrCode = new Html5Qrcode(qrReaderId);
      qrScannerRef.current = html5QrCode;

      // Iniciamos la cámara
      html5QrCode.start(
          { facingMode: "environment" }, // Pedir cámara trasera
          config,
          onScanSuccess,
          undefined // onScanFailure (lo ignoramos)
        )
        .catch((err) => {
          console.error("Error al iniciar el escáner QR:", err);
          // Si falla (ej: no hay cámara), cerramos el diálogo
          onClose();
        });

    } else {
      // Si el diálogo se cierra (isOpen = false), nos aseguramos de apagar la cámara
      if (qrScannerRef.current) {
        // Verificamos si el escáner está activo antes de detenerlo
        try {
          if (qrScannerRef.current.getState() === Html5QrcodeScannerState.SCANNING) {
            qrScannerRef.current.stop();
          }
        } catch (err) {
            console.warn("Advertencia al detener el escáner QR:", err);
        } finally {
            qrScannerRef.current = null;
        }
      }
    }

    // Función de limpieza por si el componente se desmonta inesperadamente
    return () => {
      if (qrScannerRef.current) {
        try {
          qrScannerRef.current.stop();
        } catch (err) { /* Ignorar errores al limpiar */ }
      }
    };
  }, [isOpen, onScan, onClose]); // Este efecto depende de 'isOpen'

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] md:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Escanear Código QR</DialogTitle>
          <DialogDescription>
            Apunta la cámara al código QR del asistente.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-md overflow-hidden">
          {/* Este div es el contenedor que 'html5-qrcode' usará */}
          <div id={qrReaderId} style={{ width: "100%" }} />
        </div>
      </DialogContent>
    </Dialog>
  );
}