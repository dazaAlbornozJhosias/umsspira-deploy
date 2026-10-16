import React from "react";
import { ConnectedNavbar } from "@/shared/components/navbar/index";
import { RevalidateOnPageShow } from "../../modules/auth/frontend/components/revalidate-on-pageshow";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-container min-h-screen bg-palladian text-abyssal-blue font-sans flex flex-col justify-between">
      <RevalidateOnPageShow />
      <ConnectedNavbar />
      <div className="flex-1">{children}</div>
    </div>
  );
}