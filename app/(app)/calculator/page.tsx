import { requireAdmin } from "@/lib/auth-guard";
import CalculatorClient from "./CalculatorClient";

export default async function CalculatorPage() {
  await requireAdmin("/calculator");
  return <CalculatorClient />;
}
