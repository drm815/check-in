import { NextResponse } from 'next/server';

// 공개 설정 조회 API (인증 불필요)
// chatbotEnabled 같이 학생 화면에서 필요한 설정만 허용
const ALLOWED_KEYS = ['chatbotEnabled'];

const ENV_MAP: Record<string, string> = {
    chatbotEnabled: 'CHATBOT_ENABLED',
};

const gasUrl = () => process.env.GOOGLE_SHEET_WEB_APP_URL!;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 });
    if (!ALLOWED_KEYS.includes(key)) return NextResponse.json({ error: 'forbidden key' }, { status: 403 });

    // Vercel 환경변수 우선
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
