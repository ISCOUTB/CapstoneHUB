import { proxyToBackend } from "@/app/api/proxy";

export async function GET(request: Request) {
  return proxyToBackend(request, "/stats/semesters", { cache: "no-store" });
}
