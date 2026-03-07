import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    // 관리자 인증 확인
    const token = (await cookies()).get("admin_token")?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    try {
        await verifyAuth(token);
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
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
