export const CONFIDENTIAL_NOTICE_TEXT =
  'Esta información es confidencial y sólo se usará con fines estadísticos';

/** HU-002 / T2.2: nota de confidencialidad que acompaña al salario (CA de la HU-2). */
export function SurveyConfidentialNotice() {
  return (
    <aside
      aria-label="Información confidencial"
      className="flex items-start gap-3 rounded-lg border border-oatmeal bg-palladian p-4 text-sm"
    >
      <span
        aria-hidden="true"
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-abyssal-blue text-xs font-semibold text-white"
      >
        i
      </span>
      <span className="min-w-0">
        <span className="block font-semibold text-abyssal-blue">Información confidencial</span>
        <span className="block text-abyssal-blue/70">{CONFIDENTIAL_NOTICE_TEXT}</span>
      </span>
    </aside>
  );
}
