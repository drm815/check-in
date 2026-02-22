import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { studentId, password, deviceId } = body;

        if (!studentId || !password || !deviceId) {
            return NextResponse.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 });
        }

        const gasUrl = process.env.GOOGLE_SHEET_WEB_APP_URL;
        if (!gasUrl) {
            return NextResponse.json({ error: 'GAS URL not configured' }, { status: 500 });
        }

        const response = await fetch(`${gasUrl}?action=getStudents`, { cache: 'no-store' });
        if (!response.ok) {
            return NextResponse.json({ error: '학생 정보를 불러올 수 없습니다.' }, { status: 502 });
        }

        const students = await response.json();
        const student = students.find((s: any) => String(s.id).trim() === String(studentId).trim());

        if (!student) {
            return NextResponse.json({ error: '등록되지 않은 학번입니다.' }, { status: 401 });
        }

        const correctPassword = String(student.password || student.id).trim();
        if (String(password).trim() !== correctPassword) {
            return NextResponse.json({ error: '비밀번호가 일치하지 않습니다.' }, { status: 401 });
        }

        // 기기 바인딩 검사
        if (student.deviceId && student.deviceId !== "" && student.deviceId !== deviceId) {
            return NextResponse.json({ error: '다른 기기에서 이미 로그인되어 있습니다. 기기 변경은 선생님께 문의하세요.' }, { status: 403 });
        }

        // 반환: 비밀번호 제외한 학생 정보만
        return NextResponse.json({
            success: true,
            student: {
                id: student.id,
                name: student.name,
                parentemail: student.parentemail,
                deviceId: student.deviceId,
            }
        });
    } catch (error) {
        console.error('Login API Error:', error);
        return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
    }
}
