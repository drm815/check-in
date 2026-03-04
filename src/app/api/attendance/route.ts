import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { studentId, scannedId, type } = body;

        const isHomeQR = scannedId === "CLASS_MATES_HOME_QR";

        if (!isHomeQR && studentId !== scannedId) {
            return NextResponse.json({
                success: false,
                message: '본인의 책상 QR 코드가 아닙니다. 확인 후 다시 시도해 주세요.'
            }, { status: 400 });
        }

        // 공용 하교 QR은 항상 하교 처리
        const finalType = isHomeQR ? "하교" : type;

        const gasUrl = process.env.GOOGLE_SHEET_WEB_APP_URL;
        if (!gasUrl) {
            return NextResponse.json({ error: 'GAS URL not configured' }, { status: 500 });
        }

        const reportId = crypto.randomUUID();

        const res = await fetch(gasUrl, {
            method: 'POST',
            redirect: 'follow',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({
                reportId,
                studentId: body.studentId,
                name: body.studentName || '알 수 없음',
                type: finalType,
                status: 'CONFIRMED',
                reason: 'QR 스캔'
            }),
        });

        if (!res.ok) {
            console.error('GAS Attendance error:', res.status);
            return NextResponse.json({ success: false, error: 'GAS 요청 실패' }, { status: 502 });
        }

        let data = {};
        try {
            data = await res.json();
        } catch {
            // GAS가 HTML 리다이렉트 페이지를 반환해도 기록은 완료된 것
        }
        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Attendance API Error:', error);
        return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
    }
}
