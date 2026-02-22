import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Update Announcement
export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const token = (await cookies()).get("admin_token")?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        await verifyAuth(token);

        const { id } = await context.params;
        if (!id) return NextResponse.json({ error: 'ID가 필요합니다.' }, { status: 400 });

        const body = await request.json();
        const { title, content, category } = body;
        if (!title || !content) {
            return NextResponse.json({ error: '제목과 내용은 필수입니다.' }, { status: 400 });
        }

        const gasUrl = process.env.GOOGLE_SHEET_WEB_APP_URL;
        if (!gasUrl) return NextResponse.json({ error: 'GAS URL not configured' }, { status: 500 });

        const res = await fetch(gasUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, title, content, category, action: 'updateAnnouncement' }),
        });
        if (!res.ok) {
            console.error('GAS PUT error:', res.status);
            return NextResponse.json({ error: 'Failed to update announcement' }, { status: 502 });
        }
        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Announcement PUT error:', error);
        return NextResponse.json({ error: 'Failed to update announcement' }, { status: 500 });
    }
}

// Delete Announcement
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const token = (await cookies()).get("admin_token")?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        await verifyAuth(token);

        const { id } = await context.params;
        if (!id) return NextResponse.json({ error: 'ID가 필요합니다.' }, { status: 400 });

        const gasUrl = process.env.GOOGLE_SHEET_WEB_APP_URL;
        if (!gasUrl) return NextResponse.json({ error: 'GAS URL not configured' }, { status: 500 });

        const res = await fetch(gasUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, action: 'deleteAnnouncement' }),
        });
        if (!res.ok) {
            console.error('GAS DELETE error:', res.status);
            return NextResponse.json({ error: 'Failed to delete announcement' }, { status: 502 });
        }
        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Announcement DELETE error:', error);
        return NextResponse.json({ error: 'Failed to delete announcement' }, { status: 500 });
    }
}
