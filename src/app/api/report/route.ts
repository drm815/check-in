import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const body = await request.json();
    const { studentName, type, reason, parentEmail, reportId, studentId } = body;

    try {
        // 1. Save to Google Sheets via GAS and send Email
        const gasUrl = process.env.GOOGLE_SHEET_WEB_APP_URL;
        if (gasUrl) {
            await fetch(gasUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reportId: reportId,
                    studentId: studentId,
                    name: studentName,
                    type: type,
                    status: 'PENDING',
                    reason: reason,
                    parentEmail: parentEmail
                }),
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to process report' }, { status: 500 });
    }
}
