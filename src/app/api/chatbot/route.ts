import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
    const GOOGLE_SHEET_API = process.env.GOOGLE_SHEET_API_URL;

    if (!GOOGLE_SHEET_API) {
        return NextResponse.json({ error: "API URL not configured" }, { status: 500 });
    }

    try {
        const res = await fetch(`${GOOGLE_SHEET_API}?action=getChatbotData`);
        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
    }
}
