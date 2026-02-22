import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const token = (await cookies()).get("admin_token")?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        await verifyAuth(token);

        const { id } = await params;
        const body = await request.json();
        const { status } = body;

        if (!id || !status) {
            return NextResponse.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 });
        }

        const gasUrl = process.env.GOOGLE_SHEET_WEB_APP_URL;
        if (!gasUrl) {
            return NextResponse.json({ error: 'GAS URL not configured' }, { status: 500 });
        }

        const url = new URL(gasUrl);
        url.searchParams.set('action', 'updateReportStatus');
        url.searchParams.set('id', id);
        url.searchParams.set('status', status);

        const response = await fetch(url.toString());
        if (!response.ok) {
            return NextResponse.json({ error: 'GAS 요청 실패' }, { status: 502 });
        }
        const result = await response.json();

        if (result.error) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Verify API Error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
