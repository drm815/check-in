import { NextResponse } from 'next/server';

export async function GET() {
    const GAS_URL = process.env.GOOGLE_SHEET_WEB_APP_URL;

    if (!GAS_URL) {
        return NextResponse.json({ error: 'GOOGLE_SHEET_WEB_APP_URL is not defined' }, { status: 500 });
    }

    try {
        const response = await fetch(`${GAS_URL}?action=getStudents`);

        if (!response.ok) {
            throw new Error('Failed to fetch from GAS');
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching students:', error);
        return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
    }
}
