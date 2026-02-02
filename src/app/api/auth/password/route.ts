import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { studentId, newPassword } = body;

        const gasUrl = process.env.GOOGLE_SHEET_WEB_APP_URL;
        if (!gasUrl) {
            return NextResponse.json({ error: 'GAS URL not configured' }, { status: 500 });
        }

        const response = await fetch(gasUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'changePassword',
                studentId: studentId,
                newPassword: newPassword
            }),
        });

        const result = await response.json();
        return NextResponse.json(result);
    } catch (error) {
        console.error('Password Change API Error:', error);
        return NextResponse.json({ result: 'error', message: 'Failed' }, { status: 500 });
    }
}
