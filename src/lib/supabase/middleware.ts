import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const protectedRoutes = [
  "/dashboard",
  "/calendar",
  "/requests",
  "/calls",
  "/customers",
  "/registrations",
  "/training-centers",
  "/courses",
  "/distribution",
  "/data-quality",
  "/imports",
  "/commissions",
  "/reports",
  "/users",
  "/settings",
  "/customize",
  "/developer",
  "/companies",
  "/contacts",
  "/leads",
  "/my-customers",
  "/tasks",
  "/deals",
  "/invoices",
];

const writeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function isSelectedUserPreview(request: NextRequest) {
  const rawValue = request.cookies.get("elitecrm-scope")?.value;
  if (!rawValue) return false;

  const candidates = [rawValue];
  try {
    candidates.unshift(decodeURIComponent(rawValue));
  } catch {
    // Keep the raw cookie value as a fallback.
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as {
        mode?: string;
        targetId?: string;
        previewMode?: string;
      };

      if (
        parsed.mode === "user" &&
        parsed.previewMode === "selected" &&
        Boolean(parsed.targetId)
      ) {
        return true;
      }
    } catch {
      // Try the next representation.
    }
  }

  return false;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected = protectedRoutes.some(
    (route) => path === route || path.startsWith(`${route}/`)
  );

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", `${path}${request.nextUrl.search}`);
    return NextResponse.redirect(url);
  }

  if (
    user &&
    path.startsWith("/api/") &&
    writeMethods.has(request.method) &&
    isSelectedUserPreview(request)
  ) {
    return NextResponse.json(
      {
        status: "error",
        message: "معاينة المستخدم للعرض فقط. ارجع إلى رؤية الأدمن لتنفيذ أي تعديل.",
      },
      { status: 403 }
    );
  }

  if (user && path === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
