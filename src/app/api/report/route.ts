import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { studentName, type, reason, parentEmail, reportId, studentId, targetDate } = body;

        const gasUrl = process.env.GOOGLE_SHEET_WEB_APP_URL;
        // 환경변수에 앱 URL이 있으면 사용, 없으면 요청 헤더에서 추출
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ||
            (request.headers.get('origin') ?? request.headers.get('referer')?.replace(/\/[^/]*$/, '') ?? '');
        if (gasUrl) {
            const res = await fetch(gasUrl, {
                method: 'POST',
                redirect: 'follow',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({
                    reportId,
                    studentId,
                    name: studentName,
                    type,
                    status: 'PENDING',
                    reason,
                    parentEmail,
                    targetDate,
                    appUrl,
                }),
            });
            if (!res.ok) {
                console.error('GAS report error:', res.status);
                return NextResponse.json({ success: false, error: 'GAS 요청 실패' }, { status: 502 });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to process report' }, { status: 500 });
    }
}
