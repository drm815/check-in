import { NextResponse } from "next/server";
import { signAuth } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req: Request) {
    try {
        const { password } = await req.json();

        // 1. Check Password
        const adminPass = process.env.ADMIN_PASSWORD;
        if (!adminPass) {
            return NextResponse.json({ error: "서버 설정 오류" }, { status: 500 });
        }

        if (password !== adminPass) {
            return NextResponse.json({ error: "Invalid password" }, { status: 401 });
        }

        // 2. Generate Token
        const token = await signAuth({ role: "admin" });

        // 3. Set Cookie
        (await cookies()).set({
            name: "admin_token",
            value: token,
            httpOnly: true,
            path: "/",
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 60 * 60 * 2,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
