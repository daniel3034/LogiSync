import { requireAdmin } from "@/lib/auth-guard";
import AdminWaybillsClient from "./AdminWaybillsClient";

export default async function AdminWaybillsPage() {
  await requireAdmin("/admin/waybills");
  return <AdminWaybillsClient />;
}
