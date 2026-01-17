import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const body = await request.json();
    const { studentName, type, reason, parentPhone, reportId } = body;

    try {
        // 1. Save to Google Sheets via GAS
        const gasUrl = process.env.GOOGLE_SHEET_WEB_APP_URL;
        if (gasUrl) {
            await fetch(gasUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: reportId,
                    name: studentName,
                    type: type,
                    status: 'PENDING',
                    reason: reason
                }),
            });
        }

        // 2. Clear for Aligo SMS (Replace with real API call)
        /**
         * Aligo API logic:
         * - Key: process.env.ALIGO_API_KEY
         * - UserID: process.env.ALIGO_USER_ID
         * - Sender: process.env.ALIGO_SENDER_NUMBER
         */
        const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify/${reportId}`;
        const smsMessage = `[K-Mates] ${studentName} 학생의 ${type}신고 접수. 확인: ${verifyUrl}`;

        // Aligo requires Form Data
        const formData = new URLSearchParams();
        formData.append('key', process.env.ALIGO_API_KEY || '');
        formData.append('user_id', process.env.ALIGO_USER_ID || '');
        formData.append('sender', process.env.ALIGO_SENDER_NUMBER || '');
        formData.append('receiver', parentPhone);
        formData.append('msg', smsMessage);
        formData.append('msg_type', 'SMS');

        const aligoRes = await fetch('https://apis.aligo.in/send/', {
            method: 'POST',
            body: formData,
        });

        const aligoData = await aligoRes.json();

        return NextResponse.json({ success: true, aligo: aligoData });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to process report' }, { status: 500 });
    }
}
