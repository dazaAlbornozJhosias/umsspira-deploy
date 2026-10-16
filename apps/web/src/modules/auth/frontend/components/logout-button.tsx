"use client";

import { authStore } from "../store";
import { clearSession } from "../services";
import { hardRedirect } from "../services/navigation";

export function LogoutButton() {
  function handleLogout() {
    clearSession();
    authStore.reset();
    // Con "Atrás" ya no se puede volver a ver la pantalla privada (CA-05.6)
    hardRedirect("/login");
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="text-sm font-medium text-white/90 hover:text-white"
    >
      Cerrar sesión
    </button>
  );
}
