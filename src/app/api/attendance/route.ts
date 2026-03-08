import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { studentId, scannedId, type } = body;

        const isHomeQR = scannedId === "CLASS_MATES_HOME_QR";
        const isSchoolQR = scannedId === "CLASS_MATES_SCHOOL_QR";
        const isSharedQR = isHomeQR || isSchoolQR;

        if (!isSharedQR && studentId !== scannedId) {
            return NextResponse.json({
                success: false,
                message: '본인의 책상 QR 코드가 아닙니다. 확인 후 다시 시도해 주세요.'
            }, { status: 400 });
        }

        // 공용 QR: 하교 QR은 항상 하교, 등교 QR은 항상 등교
        const finalType = isHomeQR ? "하교" : isSchoolQR ? "등교" : type;

        const gasUrl = process.env.GOOGLE_SHEET_WEB_APP_URL;
        if (!gasUrl) {
            return NextResponse.json({ error: 'GAS URL not configured' }, { status: 500 });
        }

        // studentName이 없으면 GAS에서 학생 목록 조회하여 이름 확인
        let studentName = body.studentName as string | undefined;
        if (!studentName && studentId) {
            try {
                const studentsRes = await fetch(`${gasUrl}?action=getStudents`, { cache: 'no-store' });
                if (studentsRes.ok) {
                    const students = await studentsRes.json() as { id: string; name: string }[];
                    const found = students.find((s) => s.id.toString().trim() === studentId.toString().trim());
                    if (found) studentName = found.name;
                }
            } catch {
                // 조회 실패 시 무시
            }
        }

        const reportId = crypto.randomUUID();

        const res = await fetch(gasUrl, {
            method: 'POST',
            redirect: 'follow',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({
                reportId,
                studentId: body.studentId,
                name: studentName || '알 수 없음',
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
