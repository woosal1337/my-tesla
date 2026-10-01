import { NextResponse, type NextRequest } from "next/server";
import { accessKeys, readAccessConfig, verifyAccessToken } from "@/lib/access";
import { identityHeader } from "@/lib/identity";

const access = readAccessConfig(process.env);
const keys = access ? accessKeys(access) : null;

export async function proxy(request: NextRequest) {
  if (!access || !keys) return NextResponse.next();
  const result = await verifyAccessToken(
    request.headers.get("cf-access-jwt-assertion"),
    keys,
    access,
  );
  if (!result.ok) {
    return new NextResponse("Sign in through Cloudflare Access.", {
      status: 403,
      headers: { "Cache-Control": "no-store" },
    });
  }
  const headers = new Headers(request.headers);
  const name = identityHeader();
  if (result.email) headers.set(name, result.email);
  else headers.delete(name);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!api/health|_next/static|_next/image).*)"],
};
