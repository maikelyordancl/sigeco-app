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
    // --- INICIO DE LA CORRECCIÓN ---
    // Guardamos el timer para poder limpiarlo
    let timer: NodeJS.Timeout | null = null;
    // --- FIN DE LA CORRECCIÓN ---

    if (isOpen) {
      // Esperamos 100ms para que el DOM del Dialog (que usa un Portal)
      // se renderice completamente antes de buscar el elemento.
      timer = setTimeout(() => {
        scanSuccessRef.current = false; // Reseteamos el flag
        
        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          supportedScanTypes: [],
        };

        const onScanSuccess = (decodedText: string) => {
          if (!scanSuccessRef.current) {
            scanSuccessRef.current = true;
            onScan(decodedText);
            onClose();
          }
        };

        // Asegurarnos de que no haya una instancia previa colgada
        if (qrScannerRef.current) {
          try {
            qrScannerRef.current.stop();
          } catch (e) { /* ignorar */ }
        }

        // Creamos la instancia DENTRO del timeout
        const html5QrCode = new Html5Qrcode(qrReaderId);
        qrScannerRef.current = html5QrCode;

        html5QrCode.start(
            { facingMode: "environment" }, // Pedir cámara trasera
            config,
            onScanSuccess,
            undefined // onScanFailure (lo ignoramos)
          )
          .catch((err) => {
            console.error("Error al iniciar el escáner QR:", err);
            onClose();
          });
      }, 100); // 100ms es un tiempo de espera seguro

    } else {
      // Si el diálogo se cierra (isOpen = false), nos aseguramos de apagar la cámara
      if (qrScannerRef.current) {
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

    // Función de limpieza
    return () => {
      // --- INICIO DE LA CORRECCIÓN ---
      // Si el componente se desmonta, limpiamos el timer
      if (timer) {
        clearTimeout(timer);
      }
      // --- FIN DE LA CORRECCIÓN ---

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