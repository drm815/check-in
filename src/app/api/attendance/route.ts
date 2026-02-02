import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const body = await request.json();
    const { studentId, scannedId, type } = body;

    // 1. Validation: Does the scanned ID match the student's ID?
    if (studentId !== scannedId) {
        return NextResponse.json({
            success: false,
            message: '본인의 책상 QR 코드가 아닙니다. 확인 후 다시 시도해 주세요.'
        }, { status: 400 });
    }

    try {
        const gasUrl = process.env.GOOGLE_SHEET_WEB_APP_URL;
        if (!gasUrl) {
            return NextResponse.json({ error: 'GAS URL not configured' }, { status: 500 });
        }

        const reportId = Math.random().toString(36).substr(2, 9);

        // 2. Save to Google Sheets via GAS
        const res = await fetch(gasUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                reportId: reportId,
                studentId: body.studentId,
                name: body.studentName || '알 수 없음',
                type: type, // '등교' or '하교'
                status: 'CONFIRMED',
                reason: 'QR 스캔'
            }),
        });

        const data = await res.json();
        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Attendance API Error:', error);
        return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
    }
}
