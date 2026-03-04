import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { studentId, oldPassword, newPassword } = body;

        if (!studentId || !oldPassword || !newPassword) {
            return NextResponse.json({ result: 'error', message: '필수 항목이 누락되었습니다.' }, { status: 400 });
        }

        if (!/^\d{4}$/.test(newPassword)) {
            return NextResponse.json({ result: 'error', message: '새 비밀번호는 숫자 4자리여야 합니다.' }, { status: 400 });
        }

        const gasUrl = process.env.GOOGLE_SHEET_WEB_APP_URL;
        if (!gasUrl) {
            return NextResponse.json({ error: 'GAS URL not configured' }, { status: 500 });
        }

        // 현재 비밀번호 검증을 위해 학생 정보 조회
        const studentsRes = await fetch(`${gasUrl}?action=getStudents`, { cache: 'no-store' });
        if (!studentsRes.ok) {
            return NextResponse.json({ result: 'error', message: '학생 정보 조회 실패' }, { status: 502 });
        }
        const students = await studentsRes.json();
        const student = students.find((s: any) => String(s.id).trim() === String(studentId).trim());

        if (!student) {
            return NextResponse.json({ result: 'error', message: '학생 정보를 찾을 수 없습니다.' }, { status: 404 });
        }

        const correctPassword = String(student.password || student.id).trim();
        if (String(oldPassword).trim() !== correctPassword) {
            return NextResponse.json({ result: 'error', message: '현재 비밀번호가 일치하지 않습니다.' }, { status: 401 });
        }

        const response = await fetch(gasUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({
                action: 'changePassword',
                studentId,
                newPassword,
            }),
        });

        let result = {};
        try {
            result = await response.json();
        } catch {
            // GAS HTML 리다이렉트 응답 무시
        }
        return NextResponse.json(result);
    } catch (error) {
        console.error('Password Change API Error:', error);
        return NextResponse.json({ result: 'error', message: 'Failed' }, { status: 500 });
    }
}
