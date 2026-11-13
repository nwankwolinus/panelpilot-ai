import React from "react";

interface StatusBadgeProps {
  label: string;
  variant?: "success" | "neutral" | "warning";
}

/**
 * Reusable presentation component.
 * Free of domain logic, stateful calculations, or server infrastructure.
 */
export function StatusBadge({ label, variant = "success" }: StatusBadgeProps) {
  return (
    <div className={`badge badge-${variant}`}>
      <span className="badge-dot" />
      <span>{label}</span>
    </div>
  );
}
