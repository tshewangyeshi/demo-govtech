import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Free HTTP Basic Auth gate for the pilot deployment. Vercel's native
// password protection requires the $150/mo Pro "Advanced Deployment
// Protection" add-on -- not proportionate for a pre-revenue pilot. This
// achieves the same practical result (a username/password prompt) at
// zero cost. Credentials come from env vars set in the Vercel dashboard,
// never hardcoded.
export function proxy(request: NextRequest) {
  const expectedUser = process.env.SITE_BASIC_AUTH_USER;
  const expectedPass = process.env.SITE_BASIC_AUTH_PASSWORD;

  // If not configured (e.g. local dev without the env vars set), don't
  // lock the site out -- fail open only in that specific case.
  if (!expectedUser || !expectedPass) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get("authorization");

  if (authHeader) {
    const [scheme, encoded] = authHeader.split(" ");
    if (scheme === "Basic" && encoded) {
      const decoded = Buffer.from(encoded, "base64").toString("utf-8");
      const separatorIndex = decoded.indexOf(":");
      const user = decoded.slice(0, separatorIndex);
      const pass = decoded.slice(separatorIndex + 1);
      if (user === expectedUser && pass === expectedPass) {
        return NextResponse.next();
      }
    }
  }

  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="JDWNRH Wait Times (pilot)"' },
  });
}

export const config = {
  // Exclude static assets/images so the auth prompt doesn't block CSS/JS
  // from loading once past the gate once.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
