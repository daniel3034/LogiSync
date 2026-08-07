"use client";

type DownloadWaybillPdfButtonProps = {
  waybillId: string;
  className?: string;
  size?: "sm" | "md";
};

const sizeClasses = {
  sm: "rounded-md px-3 py-1.5 text-xs",
  md: "rounded-lg px-4 py-2 text-sm",
} as const;

export default function DownloadWaybillPdfButton({
  waybillId,
  className,
  size = "sm",
}: DownloadWaybillPdfButtonProps) {
  return (
    <button
      type="button"
      onClick={() => window.open(`/api/waybills/${waybillId}/pdf`, "_blank")}
      className={
        className ??
        `${sizeClasses[size]} font-semibold text-white bg-blue-600 hover:bg-blue-700`
      }
    >
      Download PDF
    </button>
  );
}
