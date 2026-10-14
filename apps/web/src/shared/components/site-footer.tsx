export function SiteFooter() {
  return (
    <footer className="border-t border-oatmeal bg-palladian py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-6 text-center">
        <span className="font-display text-base font-bold text-abyssal-blue">
          UMSSPIRA
        </span>
        <p className="text-[13px] text-abyssal-blue">Tu comunidad, siempre conectada.</p>
        <p className="text-[11px] text-oatmeal">
          © {new Date().getFullYear()} UMSS. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
