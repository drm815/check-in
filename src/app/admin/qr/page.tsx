"use client";

import { useEffect, useRef, useState } from "react";
import QRCodeStyling from "qr-code-styling";
import { Printer, ChevronLeft, CheckSquare, Square } from "lucide-react";
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
            width: 180,
            height: 180,
            data: studentId,
            margin: 3,
            qrOptions: { errorCorrectionLevel: "H" },
            dotsOptions:         { type: "square", color },
            cornersSquareOptions: { type: "square", color },
            cornersDotOptions:    { type: "square", color },
            backgroundOptions:    { color: "#ffffff" },
        });
        qr.append(ref.current);
    }, [studentId, color]);

    return <div ref={ref} style={{ lineHeight: 0 }} />;
}

export default function QRPrintPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [printMode, setPrintMode] = useState<"all" | "selected">("all");
    const [printHomeQR, setPrintHomeQR] = useState(false);
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
                if (res.ok) setStudents(await res.json());
            } catch (err) {
                console.error("Failed to fetch students", err);
            } finally {
                setLoading(false);
            }
        }
        fetchStudents();
    }, []);

    const toggleSelect = (id: string) => {
        setSelected(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        if (selected.size === students.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(students.map(s => s.id)));
        }
    };

    const printTargets = printMode === "selected" && selected.size > 0
        ? students.filter(s => selected.has(s.id))
        : students;

    if (loading) return <div className="p-8 text-center text-gray-500">학생 명단을 불러오는 중...</div>;

    return (
        <>
            {/* 인쇄 전용 CSS */}
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #print-area, #print-area * { visibility: visible; }
                    #print-area {
                        position: fixed;
                        top: 0; left: 0;
                        width: 100%;
                        padding: 8mm;
                        box-sizing: border-box;
                    }
                    .print-grid {
                        display: grid !important;
                        grid-template-columns: 1fr 1fr !important;
                        gap: 8mm !important;
                        width: 100% !important;
                    }
                    .print-card {
                        break-inside: avoid !important;
                        page-break-inside: avoid !important;
                        border: 1.5px solid #ccc !important;
                        border-radius: 8px !important;
                        padding: 6mm !important;
                        background: white !important;
                        display: flex !important;
                        flex-direction: column !important;
                        align-items: center !important;
                        gap: 4mm !important;
                    }
                    .print-card canvas,
                    .print-card svg {
                        width: 160px !important;
                        height: 160px !important;
                    }
                    .print-home-card {
                        break-inside: avoid !important;
                        page-break-inside: avoid !important;
                        margin-bottom: 8mm !important;
                        border: 2px solid #3B82F6 !important;
                        border-radius: 8px !important;
                        padding: 6mm !important;
                        background: white !important;
                        display: flex !important;
                        flex-direction: column !important;
                        align-items: center !important;
                        gap: 3mm !important;
                        width: fit-content !important;
                        margin-left: auto !important;
                        margin-right: auto !important;
                    }
                }
            `}</style>

            <main className="min-h-screen bg-gray-50 pt-[15vh] pb-8 px-8">

                {/* ── UI 헤더 (인쇄 시 숨김) ── */}
                <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden">
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
                        인쇄하기
                    </button>
                </div>

                {/* ── 인쇄 옵션 패널 (인쇄 시 숨김) ── */}
                <div className="max-w-4xl mx-auto mb-6 bg-white rounded-2xl border border-gray-200 p-5 print:hidden">
                    <p className="text-sm font-bold text-gray-600 mb-3">인쇄 방식 선택</p>
                    <div className="flex gap-3 mb-4">
                        <button
                            onClick={() => setPrintMode("all")}
                            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${printMode === "all" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300"}`}
                        >
                            전체 인쇄
                        </button>
                        <button
                            onClick={() => setPrintMode("selected")}
                            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${printMode === "selected" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300"}`}
                        >
                            선택 인쇄 {selected.size > 0 && `(${selected.size}명)`}
                        </button>
                    </div>
                    {printMode === "selected" && (
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <button onClick={toggleAll} className="flex items-center gap-1.5 text-sm text-indigo-600 font-bold">
                                    {selected.size === students.length
                                        ? <CheckSquare size={16} />
                                        : <Square size={16} />}
                                    전체 {selected.size === students.length ? "해제" : "선택"}
                                </button>
                                <span className="text-xs text-gray-400">{selected.size}/{students.length}명 선택됨</span>
                            </div>
                            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                                {students.map((s, i) => {
                                    const flower = getFlower(i);
                                    const isOn = selected.has(s.id);
                                    return (
                                        <button
                                            key={s.id}
                                            onClick={() => toggleSelect(s.id)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${isOn ? "border-2 text-white" : "border border-gray-200 text-gray-500 bg-white hover:border-gray-300"}`}
                                            style={isOn ? { backgroundColor: flower.color, borderColor: flower.color } : {}}
                                        >
                                            <span>{flower.emoji}</span>
                                            {s.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                        <button
                            onClick={() => setPrintHomeQR(v => !v)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${printHomeQR ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-500 border-gray-200 hover:border-blue-300"}`}
                        >
                            🚪 공용 하교 QR 포함
                        </button>
                        <span className="text-xs text-gray-400">{printHomeQR ? "인쇄 시 첫 장에 공용 하교 QR이 포함됩니다" : "포함 안 함 (기본값)"}</span>
                    </div>
                    <p className="mt-3 text-xs text-gray-400">인쇄 시 A4 용지에 한 줄 2개씩 배치됩니다.</p>
                </div>

                {/* ── 인쇄 영역 ── */}
                <div id="print-area">

                    {/* 공용 하교 QR */}
                    {printHomeQR && <div className="print-home-card hidden print:flex max-w-xs mx-auto mb-6">
                        <div className="flex flex-col items-center gap-1 py-2 rounded-xl w-full" style={{ backgroundColor: "#EFF6FF" }}>
                            <span className="text-4xl leading-none">🚪</span>
                            <span className="text-base font-black" style={{ color: "#3B82F6" }}>공용 하교 QR</span>
                        </div>
                        <FlowerQR studentId="CLASS_MATES_HOME_QR" color="#3B82F6" />
                        <p className="text-[9px] text-gray-400 text-center font-bold">이 QR을 찍으면 누구든 하교 처리됩니다</p>
                    </div>}

                    {/* 공용 하교 QR - 화면용 */}
                    <div className="max-w-5xl mx-auto mb-8 print:hidden">
                        <h2 className="text-lg font-bold text-gray-700 mb-4">공용 하교 QR (1장 출력 후 게시)</h2>
                        <div className="flex justify-center">
                            <div className="bg-white border-4 p-8 rounded-3xl flex flex-col items-center gap-4" style={{ borderColor: "#3B82F6", maxWidth: 280 }}>
                                <div className="w-full flex flex-col items-center gap-1 py-3 rounded-2xl" style={{ backgroundColor: "#EFF6FF" }}>
                                    <span className="text-5xl leading-none">🚪</span>
                                    <span className="text-lg font-black tracking-tight" style={{ color: "#3B82F6" }}>공용 하교 QR</span>
                                </div>
                                <FlowerQR studentId="CLASS_MATES_HOME_QR" color="#3B82F6" />
                                <p className="text-[10px] text-gray-400 text-center font-bold">이 QR을 찍으면 누구든 하교 처리됩니다</p>
                            </div>
                        </div>
                    </div>

                    {/* QR 카드 그리드 - 화면 4열, 인쇄 2열 */}
                    <div className="print-grid max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 print:gap-4">
                        {printTargets.map((student, i) => {
                            const originalIndex = students.findIndex(s => s.id === student.id);
                            const flower = getFlower(originalIndex);
                            return (
                                <div
                                    key={student.id}
                                    className="print-card bg-white border-2 border-dashed p-5 rounded-3xl flex flex-col items-center gap-3"
                                    style={{ borderColor: flower.color + "55" }}
                                >
                                    <div className="w-full flex flex-col items-center gap-1 py-2 rounded-2xl" style={{ backgroundColor: flower.color + "18" }}>
                                        <span className="text-4xl leading-none">{flower.emoji}</span>
                                        <span className="text-base font-black tracking-tight" style={{ color: flower.color }}>
                                            {flower.name}
                                        </span>
                                    </div>
                                    <FlowerQR studentId={student.id} color={flower.color} />
                                    <p className="text-[8px] text-gray-300 text-center uppercase tracking-widest font-mono">
                                        Class-Mates Check-in
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 인쇄 가이드 */}
                <div className="max-w-4xl mx-auto mt-12 p-6 bg-indigo-50 rounded-3xl border border-indigo-100 print:hidden text-indigo-900">
                    <h4 className="font-bold mb-2">💡 인쇄 가이드</h4>
                    <ul className="text-sm space-y-1 opacity-80">
                        <li>• 인쇄 시 A4 기준 한 줄에 2개씩 배치됩니다.</li>
                        <li>• 브라우저 인쇄 설정에서 여백을 &quot;최소&quot;로 설정하면 더 잘 맞습니다.</li>
                        <li>• 라벨지나 두꺼운 용지에 인쇄하시면 더 오래 사용 가능합니다.</li>
                        <li>• QR 코드가 훼손되지 않도록 투명 테이프로 코팅하듯 붙여주세요.</li>
                    </ul>
                </div>
            </main>
        </>
    );
}
