import { proxyApi } from "@/lib/bff";

export function GET(req: Request) {
  return proxyApi(req, "/runs");
}
