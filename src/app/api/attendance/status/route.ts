import { NextResponse } from 'next/server';

// 학생 본인의 오늘 출결 상태 조회 (인증 불필요 - studentId로 자신 데이터만 조회)
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
        return NextResponse.json({ error: 'studentId required' }, { status: 400 });
    }

    const gasUrl = process.env.GOOGLE_SHEET_WEB_APP_URL;
    if (!gasUrl) {
        return NextResponse.json({ error: 'GAS URL not configured' }, { status: 500 });
    }

    try {
        const response = await fetch(`${gasUrl}?action=getAttendance`, { cache: 'no-store' });
        const data = await response.json();
        // 학생 본인 데이터만 필터링하여 반환
        const records = Array.isArray(data) ? data.filter((r: Record<string, string>) => {
            const rId = (r.studentid || r['학번'] || '').toString().trim();
            return rId === studentId.toString().trim();
        }) : [];
        return NextResponse.json(records);
    } catch {
        return NextResponse.json([]);
    }
}
