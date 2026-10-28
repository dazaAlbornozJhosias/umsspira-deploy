import { EventParticipantsHeader } from "@/shared/components/event-participants-header";
import React from "react";
import { cookies } from "next/headers";
import { ConnectedNavbar } from "@/shared/components/navbar/index";
import { RevalidateOnPageShow } from "../../modules/auth/frontend/components/revalidate-on-pageshow";
import { TituladoHeader } from "../../modules/auth/frontend/components/titulado-header";
import { ROLE_COOKIE } from "../../modules/auth/frontend/services/route-access";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const role = cookies().get(ROLE_COOKIE)?.value;

  return (
    <div className="dashboard-container min-h-screen bg-palladian text-abyssal-blue font-sans flex flex-col justify-between">
      <RevalidateOnPageShow />
      <EventParticipantsHeader>
      {role === "titulado" ? (
        <TituladoHeader />
      ) : (
        <ConnectedNavbar />
      )}
      </EventParticipantsHeader>
      <div className="flex-1">{children}</div>
    </div>
  );
}
