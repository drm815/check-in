"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Printer, ChevronLeft, Download } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Student {
    id: string;
    name: string;
    parentemail: string;
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

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <div className="p-8 text-center text-gray-500">학생 명단을 불러오는 중...</div>;

    return (
        <main className="min-h-screen bg-gray-50 pt-[15vh] pb-8 px-8 print:p-0 print:bg-white">
            {/* UI Header - Hidden when printing */}
            <div className="max-w-4xl mx-auto mb-8 flex items-center justify-between print:hidden">
                <div className="flex items-center gap-4">
                    <Link href="/admin" className="p-2 hover:bg-white rounded-xl transition-colors">
                        <ChevronLeft size={24} />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-800">책상 부착용 QR 생성기</h1>
                </div>
                <button
                    onClick={handlePrint}
                    className="btn-primary flex items-center gap-2"
                >
                    <Printer size={20} />
                    지금 바로 인쇄하기
                </button>
            </div>

            {/* Grid for QR Cards */}
            <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 print:grid-cols-3 print:gap-4">
                {students.map((student) => (
                    <div
                        key={student.id}
                        className="bg-white border-2 border-dashed border-gray-200 p-6 rounded-3xl flex flex-col items-center gap-4 print:border-solid print:border-gray-300 print:rounded-none print:break-inside-avoid"
                    >
                        <div className="text-center">
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                {student.id}
                            </span>
                            <h3 className="font-bold text-lg mt-1">{student.name}</h3>
                        </div>

                        <div className="p-2 bg-white border border-gray-100 rounded-xl">
                            <QRCodeSVG
                                value={student.id}
                                size={120}
                                level="H"
                                includeMargin={false}
                            />
                        </div>

                        <p className="text-[8px] text-gray-300 text-center uppercase tracking-widest font-mono">
                            Class-Mates QR Check-in
                        </p>
                    </div>
                ))}
            </div>

            {/* Printing Guide - Hidden when printing */}
            <div className="max-w-4xl mx-auto mt-12 p-6 bg-indigo-50 rounded-3xl border border-indigo-100 print:hidden text-indigo-900">
                <h4 className="font-bold mb-2">💡 인쇄 가이드</h4>
                <ul className="text-sm space-y-1 opacity-80">
                    <li>• 라벨지나 두꺼운 용지에 인쇄하시면 더 오래 사용 가능합니다.</li>
                    <li>• QR 코드가 훼손되지 않도록 투명 테이프로 코팅하듯 붙여주세요.</li>
                    <li>• 학생들에게 본인 책상의 QR만 찍어야 정확히 기록됨을 안내해 주세요.</li>
                </ul>
            </div>
        </main>
    );
}
