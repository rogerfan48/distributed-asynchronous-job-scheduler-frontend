import { proxyApi } from "@/lib/bff";

// Static segment — resolves before the dynamic `[id]` route.
export function GET(req: Request) {
  return proxyApi(req, "/jobs/recent");
}
