import { NextResponse } from 'next/server';

const gasUrl = () => process.env.GOOGLE_SHEET_WEB_APP_URL!;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 });

    const res = await fetch(`${gasUrl()}?action=getSetting&key=${encodeURIComponent(key)}`, { cache: 'no-store' });
    const data = await res.json();
    return NextResponse.json(data);
}

export async function POST(request: Request) {
    const body = await request.json();
    const { key, value } = body;
    if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 });

    const res = await fetch(gasUrl(), {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'saveSetting', key, value }),
    });
    const data = await res.json().catch(() => ({ result: 'success' }));
    return NextResponse.json(data);
}
