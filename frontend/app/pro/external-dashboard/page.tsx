import ExternalDashboard from "@/components/pro/ExternalDashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Advanced Dashboard | ScalpVision Pro",
  description: "High-performance market intelligence dashboard.",
};

export default function ExternalDashboardPage() {
  return <ExternalDashboard />;
}
