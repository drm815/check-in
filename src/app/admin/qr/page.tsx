"use client";

import { useEffect, useRef, useState } from "react";
import QRCodeStyling from "qr-code-styling";
import { Printer, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Student {
    id: string;
    name: string;
    parentemail: string;
}

const FLOWERS: { emoji: string; name: string; color: string }[] = [
    { emoji: "🌹", name: "장미",       color: "#FF4D6D" },
    { emoji: "🌷", name: "튤립",       color: "#FF85A1" },
    { emoji: "🌸", name: "벚꽃",       color: "#FFB3C6" },
    { emoji: "🌼", name: "데이지",     color: "#FFD166" },
    { emoji: "🌻", name: "해바라기",   color: "#F4A261" },
    { emoji: "💐", name: "부케",       color: "#C77DFF" },
    { emoji: "🪷", name: "연꽃",       color: "#E040FB" },
    { emoji: "🌺", name: "히비스커스", color: "#FF6B6B" },
    { emoji: "💮", name: "흰꽃",       color: "#74C0FC" },
    { emoji: "🌱", name: "새싹",       color: "#51CF66" },
    { emoji: "🌿", name: "민트",       color: "#40C057" },
    { emoji: "🍀", name: "클로버",     color: "#2F9E44" },
    { emoji: "🌾", name: "억새",       color: "#E8B04B" },
    { emoji: "🍁", name: "단풍",       color: "#E8590C" },
    { emoji: "🫧", name: "버블",       color: "#4DABF7" },
    { emoji: "🪻", name: "라벤더",     color: "#9775FA" },
    { emoji: "🌵", name: "선인장",     color: "#37B24D" },
    { emoji: "🌴", name: "야자수",     color: "#1E9E57" },
    { emoji: "🌲", name: "전나무",     color: "#2F6B3A" },
    { emoji: "🌳", name: "나무",       color: "#5C8A3C" },
    { emoji: "🍃", name: "나뭇잎",     color: "#66BB6A" },
    { emoji: "🍂", name: "낙엽",       color: "#D4690A" },
    { emoji: "🍄", name: "버섯",       color: "#C0392B" },
    { emoji: "🪸", name: "산호",       color: "#FF7F50" },
    { emoji: "🪴", name: "화분",       color: "#8B5E3C" },
    { emoji: "🎋", name: "대나무",     color: "#26A65B" },
    { emoji: "🌙", name: "달",         color: "#F5A623" },
];

function getFlower(index: number) {
    return FLOWERS[index % FLOWERS.length];
}

function FlowerQR({ studentId, color }: { studentId: string; color: string }) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!ref.current) return;
        ref.current.innerHTML = "";

        const qr = new QRCodeStyling({
            width: 120,
            height: 120,
            data: studentId,
            margin: 4,
            qrOptions: { errorCorrectionLevel: "H" },
            dotsOptions: {
                type: "dots",       // 동그란 점
                color: color,
            },
            cornersSquareOptions: {
                type: "extra-rounded", // 코너 큰 사각형 → 둥글게
                color: color,
            },
            cornersDotOptions: {
                type: "dot",        // 코너 내부 점 → 원형
                color: color,
            },
            backgroundOptions: {
                color: "#ffffff",
            },
        });
        qr.append(ref.current);
    }, [studentId, color]);

    return <div ref={ref} />;
}

export default function QRPrintPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const adminLogin = sessionStorage.getItem("admin_login");
        if (!adminLogin) {
            router.push("/admin/login");
            return;
        }

        async function fetchStudents() {
            try {
                const res = await fetch("/api/students");
                if (res.ok) {
                    const data = await res.json();
                    setStudents(data);
                }
            } catch (err) {
                console.error("Failed to fetch students", err);
            } finally {
                setLoading(false);
            }
        }
        fetchStudents();
    }, []);

    if (loading) return <div className="p-8 text-center text-gray-500">학생 명단을 불러오는 중...</div>;

    return (
        <main className="min-h-screen bg-gray-50 pt-[15vh] pb-8 px-8 print:p-0 print:bg-white">
            {/* UI Header - 인쇄 시 숨김 */}
            <div className="max-w-4xl mx-auto mb-8 flex items-center justify-between print:hidden">
                <div className="flex items-center gap-4">
                    <Link href="/admin" className="p-2 hover:bg-white rounded-xl transition-colors">
                        <ChevronLeft size={24} />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-800">책상 부착용 QR 생성기</h1>
                </div>
                <button
                    onClick={() => window.print()}
                    className="btn-primary flex items-center gap-2"
                >
                    <Printer size={20} />
                    지금 바로 인쇄하기
                </button>
            </div>

            {/* QR 카드 그리드 */}
            <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 print:grid-cols-3 print:gap-4">
                {students.map((student, index) => {
                    const flower = getFlower(index);
                    return (
                        <div
                            key={student.id}
                            className="bg-white border-2 border-dashed p-5 rounded-3xl flex flex-col items-center gap-3 print:border-solid print:rounded-xl print:break-inside-avoid print:p-4"
                            style={{ borderColor: flower.color + "55" }}
                        >
                            {/* 꽃 이모지 + 이름 */}
                            <div
                                className="w-full flex flex-col items-center gap-1 py-2 rounded-2xl print:py-1"
                                style={{ backgroundColor: flower.color + "18" }}
                            >
                                <span className="text-4xl print:text-3xl leading-none">{flower.emoji}</span>
                                <span
                                    className="text-base font-black tracking-tight print:text-sm"
                                    style={{ color: flower.color }}
                                >
                                    {flower.name}
                                </span>
                            </div>

                            {/* 커스텀 QR 코드 */}
                            <FlowerQR studentId={student.id} color={flower.color} />

                            <p className="text-[8px] text-gray-300 text-center uppercase tracking-widest font-mono">
                                Class-Mates Check-in
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* 인쇄 가이드 */}
            <div className="max-w-4xl mx-auto mt-12 p-6 bg-indigo-50 rounded-3xl border border-indigo-100 print:hidden text-indigo-900">
                <h4 className="font-bold mb-2">💡 인쇄 가이드</h4>
                <ul className="text-sm space-y-1 opacity-80">
                    <li>• 꽃 이름은 학생 ID 기반으로 자동 배정되며, 항상 동일하게 유지됩니다.</li>
                    <li>• 라벨지나 두꺼운 용지에 인쇄하시면 더 오래 사용 가능합니다.</li>
                    <li>• QR 코드가 훼손되지 않도록 투명 테이프로 코팅하듯 붙여주세요.</li>
                    <li>• 학생들에게 본인 책상의 QR만 찍어야 정확히 기록됨을 안내해 주세요.</li>
                </ul>
            </div>
        </main>
    );
}
