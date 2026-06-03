import { proxyApi } from "@/lib/bff";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyApi(req, `/runs/${id}/cancel`);
}
