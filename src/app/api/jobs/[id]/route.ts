import { proxyApi } from "@/lib/bff";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Ctx) {
  const { id } = await params;
  return proxyApi(req, `/jobs/${id}`);
}

export async function PUT(req: Request, { params }: Ctx) {
  const { id } = await params;
  return proxyApi(req, `/jobs/${id}`);
}

export async function DELETE(req: Request, { params }: Ctx) {
  const { id } = await params;
  return proxyApi(req, `/jobs/${id}`);
}
