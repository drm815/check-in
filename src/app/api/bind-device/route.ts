import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const gasUrl = process.env.GOOGLE_SHEET_WEB_APP_URL;
        if (!gasUrl) {
            return NextResponse.json({ error: 'GAS URL not configured' }, { status: 500 });
        }

        const body = await request.json();
        const response = await fetch(gasUrl, {
            method: 'POST',
            body: JSON.stringify({
                action: 'bindDevice',
                studentId: body.studentId,
                deviceId: body.deviceId
            })
        });

        const result = await response.json();
        return NextResponse.json(result);
    } catch (error) {
        console.error('Bind Device Error:', error);
        return NextResponse.json({ error: 'Failed to bind device' }, { status: 500 });
    }
}
