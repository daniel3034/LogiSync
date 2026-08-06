import { requireAdmin } from "@/lib/auth-guard";
import RoutesClient from "./RoutesClient";

export default async function RoutesPage() {
  await requireAdmin("/routes");
  return <RoutesClient />;
}
