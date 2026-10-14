"use client";

import { useRouter } from "next/navigation";
import { authStore } from "../store";
import { clearAccessToken } from "@/shared/services/auth-session";
import { clearSession } from "../services";

export function LogoutButton() {
  const router = useRouter();

  function handleLogout() {
    clearSession();
    clearAccessToken();
    authStore.reset();
    router.push("/login");
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