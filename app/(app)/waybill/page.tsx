import { requireAdmin } from "@/lib/auth-guard";
import WaybillClient from "./WaybillClient";

export default async function WaybillPage() {
  await requireAdmin("/waybill");
  return <WaybillClient />;
}
