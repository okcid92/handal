"use client";

import { AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";

type RiskLevel = "HIGH" | "MEDIUM" | "LOW";

interface RiskBadgeProps {
  level: RiskLevel;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
}

export function RiskBadge({ level, showIcon = true, size = "md" }: RiskBadgeProps) {
  const config = {
    HIGH: {
      bg: "bg-red-100",
      text: "text-red-700",
      border: "border-red-300",
      label: "Risque élevé",
      icon: AlertTriangle,
    },
    MEDIUM: {
      bg: "bg-orange-100",
      text: "text-orange-700",
      border: "border-orange-300",
      label: "Risque moyen",
      icon: AlertCircle,
    },
    LOW: {
      bg: "bg-green-100",
      text: "text-green-700",
      border: "border-green-300",
      label: "Risque faible",
      icon: CheckCircle,
    },
  };

  const { bg, text, border, label, icon: Icon } = config[level];
  
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-xs px-2.5 py-1",
    lg: "text-sm px-3 py-1.5",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium border ${bg} ${text} ${border} ${sizeClasses[size]}`}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {label}
    </span>
  );
}

export function getRiskColor(similarity: number): string {
  if (similarity >= 50) return "#dc2626";
  if (similarity >= 20) return "#f59e0b";
  return "#16a34a";
}

export function getRiskLabel(similarity: number): string {
  if (similarity >= 50) return "Risque élevé";
  if (similarity >= 20) return "Risque moyen";
  return "Risque faible";
}

export function getRiskLevel(similarity: number): RiskLevel {
  if (similarity >= 50) return "HIGH";
  if (similarity >= 20) return "MEDIUM";
  return "LOW";
}