import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { studentId, name, targetDate } = body;

        if (!studentId || !name) {
            return NextResponse.json({ error: 'studentId와 name은 필수입니다.' }, { status: 400 });
        }

        const GAS_URL = process.env.GOOGLE_SHEET_WEB_APP_URL;
        if (!GAS_URL) {
            return NextResponse.json({ error: 'GOOGLE_SHEET_WEB_APP_URL is not defined' }, { status: 500 });
        }

        const payload = {
            action: 'manualCheckIn',
            studentId,
            name,
            type: "등교",
            status: "CONFIRMED",
            reason: "관리자 수동 등록",
            targetDate: targetDate || new Date().toISOString().split('T')[0],
            timestamp: new Date().toISOString()
        };

        const response = await fetch(GAS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error('Failed to send data to GAS');
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error manual check-in:', error);
        return NextResponse.json({ error: 'Failed to manual check-in' }, { status: 500 });
    }
}
