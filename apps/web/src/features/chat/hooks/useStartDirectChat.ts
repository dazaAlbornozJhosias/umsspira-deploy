"use client";
import { useRouter } from "next/navigation";
export const useStartDirectChat = () => {
  const router = useRouter();
  return {
    startChat: (targetUserId: string) =>
      router.push(
        `/portal/mensajes?recipient=${encodeURIComponent(targetUserId)}`,
      ),
    loading: false,
    error: null,
    clearError: () => undefined,
  };
};
