'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { CheckCircle2, Plus, Trash2 } from 'lucide-react';
import type { RegisteredCompanyResponse } from '@umsspira/shared-types';
import { Button } from '@/shared/components/button';
import { Input } from '@/shared/components/input';
import { registerCompany } from '../services/company-registry.service';
import {
  hasErrors,
  MAX_INITIAL_ACCOUNTS,
  toRegisterCompanyPayload,
  validateRegisterCompany,
  type AccountDraft,
  type RegisterCompanyErrors,
  type RegisterCompanyFormState,
} from '../validation/register-company';
import { formatDate, ROLE_LABELS } from './registry-format';

const EMPTY_FORM: RegisterCompanyFormState = {
  companyName: '',
  taxId: '',
  accounts: [{ email: '', role: 'administrador' }],
};
const NO_ERRORS: RegisterCompanyErrors = { accountEmails: {} };

export function RegisterCompanyForm() {
  const [form, setForm] = useState<RegisterCompanyFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<RegisterCompanyErrors>(NO_ERRORS);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<RegisteredCompanyResponse | null>(null);

  const updateAccount = (index: number, changes: Partial<AccountDraft>) =>
    setForm((current) => ({
      ...current,
      accounts: current.accounts.map((account, position) =>
        position === index ? { ...account, ...changes } : account,
      ),
    }));

  const addAccount = () =>
    setForm((current) => ({ ...current, accounts: [...current.accounts, { email: '', role: 'reclutador' }] }));

  const removeAccount = (index: number) => {
    setErrors(NO_ERRORS);
    setForm((current) => ({
      ...current,
      accounts: current.accounts.filter((_, position) => position !== index),
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateRegisterCompany(form);
    setErrors(nextErrors);
    setSubmitError(null);
    if (hasErrors(nextErrors)) {
      return;
    }
    setSubmitting(true);
    try {
      setCreated(await registerCompany(toRegisterCompanyPayload(form)));
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'No fue posible registrar la empresa.');
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setForm(EMPTY_FORM);
    setErrors(NO_ERRORS);
    setSubmitError(null);
    setCreated(null);
  };

  if (created) {
    return (
      <section role="status" className="space-y-4 rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-emerald-600" aria-hidden="true" />
          <h2 className="text-lg font-bold text-abyssal-blue">Empresa registrada</h2>
        </div>
        <p className="text-sm text-abyssal-blue/80">
          Se enviaron {created.invitations.length} invitaciones para <strong>{created.companyName}</strong> (NIT{' '}
          {created.taxId}). Los enlaces vencen el {formatDate(created.invitations[0]?.expiresAt)}.
        </p>
        <ul className="space-y-1 rounded-lg bg-palladian/60 p-4 text-sm text-abyssal-blue">
          {created.invitations.map((invitation) => (
            <li key={invitation.email}>
              {invitation.email} · {ROLE_LABELS[invitation.role]}
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/company-registry"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-blue-fantastic px-6 text-sm font-semibold text-white hover:bg-abyssal-blue"
          >
            Ver empresas registradas
          </Link>
          <Button type="button" variant="secondary" onClick={reset}>
            Registrar otra empresa
          </Button>
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6 rounded-2xl border border-oatmeal bg-white p-6 shadow-sm">
      <fieldset className="space-y-4">
        <legend className="mb-2 text-base font-bold text-abyssal-blue">Datos de la empresa</legend>
        <Input
          id="company-name"
          label="Razón social"
          required
          value={form.companyName}
          onChange={(event) => setForm((current) => ({ ...current, companyName: event.target.value }))}
          error={errors.companyName}
          maxLength={100}
        />
        <Input
          id="company-tax-id"
          label="NIT"
          required
          inputMode="numeric"
          value={form.taxId}
          onChange={(event) => setForm((current) => ({ ...current, taxId: event.target.value }))}
          error={errors.taxId}
          maxLength={15}
          placeholder="Solo dígitos"
        />
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-1 text-base font-bold text-abyssal-blue">Cuentas iniciales</legend>
        <p className="text-sm text-abyssal-blue/70">
          Cada cuenta recibirá un correo con su enlace de activación. Debe haber al menos un administrador.
        </p>

        {form.accounts.map((account, index) => (
          <div key={index} className="grid gap-3 rounded-lg border border-palladian p-3 sm:grid-cols-[1fr_180px_auto] sm:items-start">
            <Input
              id={`account-email-${index}`}
              label={`Correo de la cuenta ${index + 1}`}
              required
              type="email"
              value={account.email}
              onChange={(event) => updateAccount(index, { email: event.target.value })}
              error={errors.accountEmails[index]}
              placeholder="correo@empresa.com"
            />
            <div className="flex flex-col gap-1.5">
              <label htmlFor={`account-role-${index}`} className="text-[13px] font-semibold text-abyssal-blue">
                Rol de la cuenta {index + 1}
              </label>
              <select
                id={`account-role-${index}`}
                value={account.role}
                onChange={(event) => updateAccount(index, { role: event.target.value as AccountDraft['role'] })}
                className="h-11 rounded-lg border border-oatmeal bg-palladian px-3 text-sm text-abyssal-blue outline-none focus:border-2 focus:border-blue-fantastic focus:bg-white"
              >
                <option value="administrador">{ROLE_LABELS.administrador}</option>
                <option value="reclutador">{ROLE_LABELS.reclutador}</option>
              </select>
            </div>
            <button
              type="button"
              onClick={() => removeAccount(index)}
              disabled={form.accounts.length === 1}
              aria-label={`Quitar la cuenta ${index + 1}`}
              className="mt-6 inline-flex h-11 items-center justify-center rounded-lg px-3 text-truffle-trouble hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ))}

        {errors.accounts && (
          <p role="alert" className="text-sm font-medium text-truffle-trouble">
            {errors.accounts}
          </p>
        )}

        <Button
          type="button"
          variant="secondary"
          onClick={addAccount}
          disabled={form.accounts.length >= MAX_INITIAL_ACCOUNTS}
          className="inline-flex items-center gap-2"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Agregar cuenta
        </Button>
      </fieldset>

      {submitError && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-truffle-trouble">
          {submitError}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Registrando...' : 'Registrar y enviar invitaciones'}
        </Button>
      </div>
    </form>
  );
}