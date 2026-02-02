import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const gasUrl = process.env.GOOGLE_SHEET_WEB_APP_URL;
        if (!gasUrl) {
            return NextResponse.json({ error: 'GAS URL not configured' }, { status: 500 });
        }

        const response = await fetch(`${gasUrl}?action=getAttendance`, { cache: 'no-store' });
        const data = await response.json();

        return NextResponse.json(data);
    } catch (error) {
        console.error('Fetch Attendance Error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
