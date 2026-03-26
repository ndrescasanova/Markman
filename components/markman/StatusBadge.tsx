import type { TrademarkStatus } from "@/lib/brand-health/score";

const STATUS_STYLES: Record<TrademarkStatus, string> = {
  REGISTERED: "bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]",
  PENDING:    "bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]",
  ABANDONED:  "bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]",
  CANCELLED:  "bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]",
  OFFICE_ACTION: "bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]",
  UNKNOWN:    "bg-[#F9FAFB] text-[#6B7280] border border-[#E5E7EB]",
};

export function StatusBadge({ status }: { status: TrademarkStatus | string }) {
  const styles = STATUS_STYLES[status as TrademarkStatus] ?? STATUS_STYLES.UNKNOWN;
  const label = status === "OFFICE_ACTION" ? "Office Action" : status.charAt(0) + status.slice(1).toLowerCase();

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles}`}>
      {label}
    </span>
  );
}
