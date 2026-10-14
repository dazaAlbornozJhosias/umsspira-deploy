import type { HTMLAttributes } from "react";

import { cn } from "../utils/cn";

export type RequestStatus = "pending" | "observed" | "approved" | "rejected";

type BadgeVariant = RequestStatus | "neutral" | "alert";

const BASE_CLASSES =
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium leading-5 whitespace-nowrap";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  pending: "border-oatmeal bg-oatmeal text-abyssal",
  observed: "border-burning-flame bg-burning-flame text-abyssal",
  approved: "border-abyssal bg-abyssal text-palladian",
  rejected: "border-truffle-trouble bg-truffle-trouble text-palladian",
  neutral: "border-oatmeal bg-palladian text-abyssal",
  alert: "border-truffle-trouble bg-truffle-trouble text-palladian",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(BASE_CLASSES, VARIANT_CLASSES[variant], className)}
      {...props}
    />
  );
}

const STATUS_LABELS: Record<RequestStatus, string> = {
  pending: "Pendiente",
  observed: "Observado",
  approved: "Aprobado",
  rejected: "Rechazado",
};

interface StatusBadgeProps extends Omit<BadgeProps, "variant"> {
  status: RequestStatus;
}

export function StatusBadge({ status, ...props }: StatusBadgeProps) {
  return (
    <Badge variant={status} {...props}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

const HOUR_IN_MS = 60 * 60 * 1000;

interface AgeBadgeProps extends Omit<BadgeProps, "variant"> {
  submittedAt: Date | string;
  thresholdHours?: number;
  now?: Date;
}

export function AgeBadge({
  submittedAt,
  thresholdHours = 48,
  now = new Date(),
  ...props
}: AgeBadgeProps) {
  const submittedTime = new Date(submittedAt).getTime();

  if (Number.isNaN(submittedTime)) {
    return (
      <Badge variant="neutral" {...props}>
        Fecha no disponible
      </Badge>
    );
  }

  const elapsedHours = Math.max(
    0,
    Math.floor((now.getTime() - submittedTime) / HOUR_IN_MS),
  );
  const isOverdue = elapsedHours >= thresholdHours;

  const label = isOverdue
    ? `Más de ${thresholdHours} h`
    : elapsedHours < 1
      ? "Menos de 1 h"
      : `${elapsedHours} h`;

  return (
    <Badge
      variant={isOverdue ? "alert" : "neutral"}
      aria-label={
        isOverdue
          ? `Sin dictamen hace más de ${thresholdHours} horas`
          : `Enviada hace ${label}`
      }
      {...props}
    >
      {label}
    </Badge>
  );
}
