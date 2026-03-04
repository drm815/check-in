import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const gasUrl = process.env.GOOGLE_SHEET_WEB_APP_URL;
        if (!gasUrl) return NextResponse.json({ error: 'GAS URL not configured' }, { status: 500 });

        const res = await fetch(`${gasUrl}?action=getAnnouncements`);
        if (!res.ok) {
            console.error('GAS GET error:', res.status);
            return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 502 });
        }
        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Announcement GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const token = (await cookies()).get("admin_token")?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        await verifyAuth(token);

        const body = await request.json();
        const { title, content, category } = body;
        if (!title || !content) {
            return NextResponse.json({ error: '제목과 내용은 필수입니다.' }, { status: 400 });
        }

        const gasUrl = process.env.GOOGLE_SHEET_WEB_APP_URL;
        if (!gasUrl) return NextResponse.json({ error: 'GAS URL not configured' }, { status: 500 });

        const res = await fetch(gasUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ title, content, category, action: 'addAnnouncement' }),
        });
        if (!res.ok) {
            console.error('GAS POST error:', res.status);
            return NextResponse.json({ error: 'Failed to save announcement' }, { status: 502 });
        }
        let data = {};
        try {
            data = await res.json();
        } catch {
            // GAS HTML 리다이렉트 응답 무시
        }
        return NextResponse.json(data);
    } catch (error) {
        console.error('Announcement POST error:', error);
        return NextResponse.json({ error: 'Failed to save announcement' }, { status: 500 });
    }
}
