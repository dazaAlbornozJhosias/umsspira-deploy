"use client";

import React from "react";
import { QRCodeSVG } from "qrcode.react";
// 👇 Importamos el botón que me acabas de mostrar (Ajusta la ruta si es necesario)
import { Button } from "@/shared/components/button";; 

type PassStatus = "VALID" | "ACTIVO" | "INVALID" | "ERROR" | "RECOVERED";

interface EventPassProps {
  status: PassStatus | string;
  eventName: string;
  userName?: string;
  dateTime?: string;
  location?: string;
  passId?: string;
  qrToken?: string;
  onBack: () => void;
  onRetry?: () => void;
  statusLabel?: string;
  statusDescription?: string;
  hideBackButton?: boolean;
}

export const EventPassCard: React.FC<EventPassProps> = ({
  status,
  eventName,
  userName,
  dateTime,
  location,
  passId,
  qrToken,
  onBack,
  onRetry,
  statusLabel,
  statusDescription,
  hideBackButton = false,
}) => {
  const isError = status === "ERROR";
  const isInvalid = status === "INVALID" || status === "INVALIDADO" || status === "VENCIDO";
  const isRecovered = status === "RECOVERED";
  
  const isValid = status === "VALID" || status === "ACTIVO" || isRecovered;

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col md:flex-row rounded-2xl overflow-hidden shadow-umss-lg border border-oatmeal font-sans">
      
      {/* COLUMNA IZQUIERDA (40%) - Fondo Blue Fantastic */}
      <div className="md:w-[40%] bg-blue-fantastic p-8 flex flex-col items-center justify-center text-center relative">
        <div className="absolute top-8 left-8 text-left">
          {/* Tipografía Playfair para marca */}
          <h3 className="text-white font-display font-bold text-xl tracking-wider">UMSSPIRA</h3>
          <p className="text-burning-flame text-[10px] font-semibold tracking-widest uppercase mt-1">Pase de evento</p>
        </div>

        <div className="mt-16 mb-8 flex flex-col items-center">
          {/* Mostrar QR si es válido */}
          {isValid && qrToken && (
            <div className="bg-palladian p-3 rounded-xl shadow-umss">
              {/* Aquí mantenemos los Hex porque la librería de SVG no lee clases de Tailwind */}
              <QRCodeSVG value={qrToken} size={160} fgColor="#1B2632" bgColor="#EEE9DF" />
            </div>
          )}

          {/* Mostrar estado difuminado/inválido */}
          {isInvalid && (
            <div className="relative bg-blue-fantastic border-4 border-dashed border-oatmeal/30 w-[160px] h-[160px] rounded-xl flex items-center justify-center">
               <div className="bg-truffle-trouble text-white text-[14px] font-bold py-2 px-6 rounded-md z-10">
                 NO VÁLIDO
               </div>
            </div>
          )}

          {/* Mostrar alerta de error */}
          {isError && (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full border-2 border-burning-flame flex items-center justify-center text-burning-flame text-3xl mb-4">
                !
              </div>
              <h4 className="text-white font-display text-xl">QR pendiente</h4>
            </div>
          )}

          {/* Mostrar éxito en recuperación */}
          {isRecovered && (
             <div className="flex flex-col items-center mt-4">
               <div className="w-12 h-12 rounded-full border-2 border-burning-flame flex items-center justify-center text-burning-flame text-xl mb-2">
                 ✓
               </div>
               <p className="text-white text-[14px] font-medium">Sin duplicados</p>
             </div>
          )}
        </div>

        {/* Badges y código inferior */}
        {!isError && (
          <>
            <div className={`mt-auto text-[11px] font-bold py-1 px-4 rounded-full ${isInvalid ? 'hidden' : 'bg-palladian text-abyssal-blue'}`}>
               VÁLIDO
            </div>
            {passId && (
              <div className="mt-4 text-left w-full">
                <p className="text-oatmeal text-[10px] uppercase font-semibold">ID Pase</p>
                <p className="text-white text-[14px] font-mono">{passId}</p>
              </div>
            )}
          </>
        )}
        {isError && (
           <div className="mt-auto bg-palladian text-abyssal-blue text-[11px] font-bold py-1 px-4 rounded-full uppercase">
             Inscripción Confirmada
           </div>
        )}
      </div>

      {/* COLUMNA DERECHA (60%) - Fondo Palladian */}
      <div className="md:w-[60%] bg-palladian p-8 md:p-12 flex flex-col justify-center">
        
        {/* Título Oficial H1/H2 según manual (Inter, Bold, 32px) */}
        <h1 className="font-sans font-bold text-[32px] leading-[40px] text-abyssal-blue mb-4">
          {eventName}
        </h1>
        
        {/* Badge de estado */}
        {!isError && !isRecovered && (
          <div className="inline-block bg-oatmeal/30 border border-oatmeal text-abyssal-blue text-[11px] font-bold py-1 px-3 rounded-full mb-8 w-fit">
            {statusLabel ?? (isInvalid ? 'EVENTO CANCELADO' : 'INSCRIPCIÓN CONFIRMADA')}
          </div>
        )}

        {isInvalid && (
          <p className="text-abyssal-blue text-[14px] mt-4 mb-12">
            {statusDescription ?? 'Este pase fue invalidado porque el evento ya no está activo.'}
          </p>
        )}

        {isError && (
          <div className="mt-4">
            <p className="text-truffle-trouble text-[14px] font-medium mb-6">
              No se pudo generar el código QR en este momento.
            </p>
            <div className="border border-truffle-trouble bg-truffle-trouble/10 p-4 rounded-lg text-center mb-8">
              <p className="text-truffle-trouble text-[11px] font-medium">
                No se crearon pases duplicados ni inconsistentes. Puedes reintentar de forma segura.
              </p>
            </div>
          </div>
        )}

        {isRecovered && (
           <div className="mt-4 mb-8">
             <p className="text-abyssal-blue text-[14px] font-medium mb-4">
               Ya existía un pase vigente para esta inscripción.
             </p>
             <div className="border border-oatmeal bg-oatmeal/30 p-6 rounded-lg text-center">
               <p className="text-abyssal-blue text-[14px] font-medium">
                 El sistema recuperó el mismo pase y conservó su identificador original.
               </p>
             </div>
           </div>
        )}

        {/* Datos del evento usando etiquetas (11px/13px) y cuerpos (14px) del manual */}
        {isValid && !isRecovered && (
          <div className="space-y-5">
            <div>
              <p className="text-[11px] text-abyssal-blue/60 uppercase font-semibold">Titulado</p>
              <p className="text-abyssal-blue text-[14px] font-medium">{userName}</p>
            </div>
            <div>
              <p className="text-[11px] text-abyssal-blue/60 uppercase font-semibold">Fecha y hora</p>
              <p className="text-abyssal-blue text-[14px] font-medium">{dateTime}</p>
            </div>
            <div>
              <p className="text-[11px] text-abyssal-blue/60 uppercase font-semibold">Ubicación</p>
              <p className="text-abyssal-blue text-[14px] font-medium">{location}</p>
            </div>
            <hr className="border-oatmeal my-4" />
            <p className="text-[11px] text-abyssal-blue/80 leading-[16px] font-medium">
              Este QR es único para tu inscripción. No compartas tu identificador de pase.
            </p>
          </div>
        )}
        {/* BOTONES OFICIALES */}
        <div className="mt-auto pt-8 flex flex-col md:flex-row gap-4">
          {!hideBackButton && (
            <Button
              variant="secondary"
              onClick={onBack}
              className="flex-1 md:flex-none"
            >
              {isError ? 'Volver a mis eventos' : 'Volver a mis pases'}
            </Button>
          )}

          {isError && (
            <Button
              variant="primary"
              onClick={onRetry}
              className="flex-1 md:flex-none"
            >
              Reintentar
            </Button>
          )}

          {isRecovered && (
            <Button
              variant="primary"
              className="flex-1 md:flex-none"
            >
              Abrir pase
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};