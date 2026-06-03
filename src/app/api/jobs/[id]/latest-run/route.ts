import { proxyApi } from "@/lib/bff";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyApi(req, `/jobs/${id}/latest-run`);
}
