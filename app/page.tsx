import { Dashboard } from "@/components/dashboard";
import { getBootstrapSnapshot } from "@/lib/bootstrap";

export const dynamic = "force-dynamic";

export default function Home() {
  return <Dashboard initialData={getBootstrapSnapshot()} />;
}
