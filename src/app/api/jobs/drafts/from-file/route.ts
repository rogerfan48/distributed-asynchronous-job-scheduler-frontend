import { proxyApi } from "@/lib/bff";

// Multipart file upload → editable draft. proxyApi forwards the raw body and
// preserves the multipart Content-Type/boundary.
export function POST(req: Request) {
  return proxyApi(req, "/jobs/drafts/from-file");
}
