import React from "react";
import { ConnectedNavbar } from "@/shared/components/navbar/index";

// Demo: una sola barra global, la navbar compartida (Epic 8)
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-container">
      <ConnectedNavbar />
      {children}
    </div>
  );
}