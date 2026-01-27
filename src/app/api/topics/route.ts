import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const gasUrl = process.env.GOOGLE_SHEET_WEB_APP_URL;
        if (!gasUrl) {
            return NextResponse.json({ error: 'GAS URL not configured' }, { status: 500 });
        }

        const response = await fetch(`${gasUrl}?action=getTopics`);
        const topics = await response.json();

        return NextResponse.json(topics);
    } catch (error) {
        console.error('Fetch Topics Error:', error);
        return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 });
    }
}
