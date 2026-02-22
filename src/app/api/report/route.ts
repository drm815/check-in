import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { studentName, type, reason, parentEmail, reportId, studentId, targetDate } = body;

        const gasUrl = process.env.GOOGLE_SHEET_WEB_APP_URL;
        if (gasUrl) {
            await fetch(gasUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reportId,
                    studentId,
                    name: studentName,
                    type,
                    status: 'PENDING',
                    reason,
                    parentEmail,
                    targetDate
                }),
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to process report' }, { status: 500 });
    }
}
