import { proxyApi } from "@/lib/bff";

export function GET(req: Request) {
  return proxyApi(req, "/jobs");
}

export function POST(req: Request) {
  return proxyApi(req, "/jobs");
}
