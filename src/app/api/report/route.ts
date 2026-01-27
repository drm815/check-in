import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const body = await request.json();
    const { studentName, type, reason, parentEmail, reportId } = body;

    try {
        // 1. Save to Google Sheets via GAS and send Email
        const gasUrl = process.env.GOOGLE_SHEET_WEB_APP_URL;
        if (gasUrl) {
            await fetch(gasUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: reportId,
                    name: studentName,
                    type: type,
                    status: 'PENDING',
                    reason: reason,
                    parentEmail: parentEmail // Pass Email for GAS Gmail notification
                }),
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to process report' }, { status: 500 });
    }
}
