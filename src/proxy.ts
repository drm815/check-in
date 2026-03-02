import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAuth } from "@/lib/auth";

export async function proxy(req: NextRequest) {
    // Only check paths starting with /admin (pages) or /api/admin (endpoints)
    // But exclude /admin/login page and /api/admin/login endpoint
    if (req.nextUrl.pathname.startsWith('/admin') && !req.nextUrl.pathname.startsWith('/admin/login')) {
        const token = req.cookies.get("admin_token")?.value;

        // If no token or invalid, redirect to login
        if (!token) {
            return NextResponse.redirect(new URL("/admin/login", req.url));
        }

        try {
            await verifyAuth(token);
            return NextResponse.next();
        } catch (error) {
            // Token invalid/expired
            return NextResponse.redirect(new URL("/admin/login", req.url));
        }
    }

    if (req.nextUrl.pathname.startsWith('/api/admin') && !req.nextUrl.pathname.startsWith('/api/admin/login')) {

        const token = req.cookies.get("admin_token")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        try {
            await verifyAuth(token);
            return NextResponse.next();
        } catch (error) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*", "/api/admin/:path*"],
};
