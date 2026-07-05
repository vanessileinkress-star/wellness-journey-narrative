import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/fitness/Dashboard";

export const Route = createFileRoute("/")({
  component: Dashboard,
});
