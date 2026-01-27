import { NextResponse } from 'next/server';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    try {
        const gasUrl = process.env.GOOGLE_SHEET_WEB_APP_URL;
        if (!gasUrl) {
            return NextResponse.json({ error: 'GAS URL not configured' }, { status: 500 });
        }

        // Forward status update to GAS
        const response = await fetch(`${gasUrl}?action=updateReportStatus&id=${id}&status=${status}`);
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
