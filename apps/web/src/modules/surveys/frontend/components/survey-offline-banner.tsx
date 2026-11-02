"use client";

import { useNetworkStatus } from "../hooks/use-network-status";

export function SurveyOfflineBanner() {
  const { isOffline } = useNetworkStatus();

  if (!isOffline) return null;

  
  return (
    <div
      role="alert"
      className="rounded-lg border border-yellow-400 bg-yellow-100 p-4 text-yellow-900"
    >
      <p className="font-semibold">
        Sin conexión a Internet
      </p>
      <p className="text-sm">
        No tienes conexión. Evita enviar la encuesta
        hasta recuperar el acceso a Internet.
      </p>
    </div>
  );

}
