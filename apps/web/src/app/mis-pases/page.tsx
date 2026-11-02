"use client";

import React, { useEffect, useState } from "react";
// Import con minúscula tal como lo exige tu proyecto
import { Navbar } from "@/shared/components/navbar"; 
import { EventPassCard } from "@/modules/events/components/EventPassCard";
import { apiClient } from "@/shared/services/api-client";

interface PassData {
  id: string;
  registrationId: string;
  eventId: string;
  userId: string;
  qrToken: string;
  status: "VALID" | "INVALID" | "ERROR" | "RECOVERED" | "ACTIVO";
  isValidForAccess: boolean;
  issuedAt: string;
  eventDetails?: {
    name: string;
    userName: string;
    dateTime: string;
    location: string;
  };
}

export default function MyPassesPage() {
  const [passes, setPasses] = useState<PassData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPasses = async () => {
    try {
      setLoading(true);
      const response = await apiClient<PassData[] | { data: PassData[] }>(
        "/api/v1/registrations/my-passes",
        { authenticated: true }
      );
      const list = Array.isArray(response) ? response : response?.data ?? [];
      setPasses(list);
    } catch (error) {
      console.error("Error al obtener los pases:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchPasses();
  }, []);

  // Pantalla de carga usando los colores del manual
  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-palladian">
          <p className="font-sans text-abyssal-blue font-semibold text-[14px]">
            Cargando tus pases...
          </p>
        </div>
      </>
    );
  }

  // Pantalla principal aplicando el sistema tipográfico
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-palladian p-4 md:p-8 font-sans">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Título de Sección H1 Oficial (Inter, Bold, 32px) */}
          <h1 className="font-sans font-bold text-[32px] leading-[40px] text-abyssal-blue mb-8">
            Mis Credenciales
          </h1>
          
          {passes.length === 0 ? (
            <p className="font-sans text-abyssal-blue text-[14px]">
              No tienes pases generados actualmente.
            </p>
          ) : (
            passes.map((pass) => (
              <EventPassCard
                key={pass.id}
                status={!pass.isValidForAccess ? "INVALID" : pass.status}
                eventName={pass.eventDetails?.name || "Evento UMSSPIRA"}
                userName={pass.eventDetails?.userName || "Titulado"}
                dateTime={pass.eventDetails?.dateTime || "Fecha por definir"}
                location={pass.eventDetails?.location || "Campus UMSS"}
                passId={pass.id.split("-").pop()}
                qrToken={pass.qrToken}
                onBack={() => window.history.back()}
                onRetry={() => window.location.reload()}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}