import { NextResponse } from 'next/server';

// 환경변수 키 매핑 (Vercel 환경변수 우선, GAS 폴백)
const ENV_MAP: Record<string, string> = {
    chatbotEnabled: 'CHATBOT_ENABLED',
};

const gasUrl = () => process.env.GOOGLE_SHEET_WEB_APP_URL!;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 });

    // Vercel 환경변수에 값이 있으면 GAS 호출 없이 즉시 반환
    const envKey = ENV_MAP[key];
    if (envKey && process.env[envKey] !== undefined) {
        return NextResponse.json({ value: process.env[envKey] });
    }

    // 폴백: GAS에서 조회
    try {
        const res = await fetch(`${gasUrl()}?action=getSetting&key=${encodeURIComponent(key)}`, {
            cache: 'no-store',
            redirect: 'follow',
        });
        const data = await res.json();
        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ value: null });
    }
}

export async function POST(request: Request) {
    const body = await request.json();
    const { key, value } = body;
    if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 });

    // GAS에 저장
    try {
        const res = await fetch(gasUrl(), {
            method: 'POST',
            redirect: 'follow',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ action: 'saveSetting', key, value }),
        });
        const data = await res.json().catch(() => ({ result: 'success' }));
        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ result: 'success' });
    }
}
