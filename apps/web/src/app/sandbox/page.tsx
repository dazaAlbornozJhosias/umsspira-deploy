import { CompanyDropdown } from "@/shared/components/company-dropdown";

export default function TestPage() {
  return (
    <main className="min-h-screen bg-gray-100 p-8 flex justify-end">
      {/* Aquí estamos "llamando" a tu componente para que se dibuje en pantalla */}
      <CompanyDropdown />
    </main>
  );
}