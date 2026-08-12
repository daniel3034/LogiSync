"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  driverId: string;
  driverName: string;
  waybillCount: number;
};

export default function DeleteDriverButton({
  driverId,
  driverName,
  waybillCount,
}: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/drivers/${driverId}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete driver");
      }

      setConfirming(false);
      router.refresh();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete driver"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => {
          setError(null);
          setConfirming(true);
        }}
        className="rounded-lg px-3 py-1.5 text-sm text-red-700 transition hover:bg-red-50"
      >
        Delete
      </button>
    );
  }

  return (
    <div className="max-w-xs space-y-2">
      <p className="text-xs text-zinc-600">
        Delete {driverName}? Their waybills will be unassigned, not deleted
        {waybillCount > 0 ? ` (${waybillCount} currently assigned)` : ""}.
      </p>
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void handleDelete()}
          disabled={isDeleting}
          className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white transition hover:bg-red-700 disabled:opacity-60"
        >
          {isDeleting ? "Deleting…" : "Confirm delete"}
        </button>
        <button
          type="button"
          onClick={() => {
            setConfirming(false);
            setError(null);
          }}
          disabled={isDeleting}
          className="rounded-lg px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
