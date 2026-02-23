import { NextResponse } from "next/server";
import { signAuth } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req: Request) {
    try {
        const { id, password } = await req.json();
        const adminId = process.env.ADMIN_ID;
        const adminPass = process.env.ADMIN_PASSWORD;

        if (!adminId || !adminPass) {
            console.error("❌ [Login Error] Server environment variables are missing.");
            return NextResponse.json({ error: "서버 설정 오류" }, { status: 500 });
        }

        if (id !== adminId.trim() || password !== adminPass.trim()) {
            console.warn(`⚠️ [Login Failed] ID: ${id}`);
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        console.log(`✅ [Login Success] Admin logged in: ${id}`);
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
        console.error("❌ [Server Error]", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
