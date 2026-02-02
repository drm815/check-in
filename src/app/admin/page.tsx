import { useState, useEffect } from "react";
import {
    Users,
    ExternalLink,
    Search,
    FileSpreadsheet,
    Download,
    Filter,
    CheckCircle2,
    AlertCircle,
    Clock,
    LayoutDashboard,
    Settings,
    Loader2
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState("attendance");
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState<any[]>([]);
    const [attendance, setAttendance] = useState<any[]>([]);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const [studentsRes, attendanceRes] = await Promise.all([
                    fetch("/api/students"),
                    fetch("/api/admin/attendance")
                ]);

                if (studentsRes.ok) setStudents(await studentsRes.json());
                if (attendanceRes.ok) setAttendance(await attendanceRes.json());
            } catch (err) {
                console.error("Failed to fetch admin data", err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    // Derived data
    const totalStudents = students.length;
    const todayArrivals = attendance.filter(r => r.type === "등교").length;
    const pendingReports = attendance.filter(r => r.status === "PENDING").length;

    const filteredRecords = () => {
        if (activeTab === "attendance") {
            return attendance.filter(r => r.type === "등교" || r.type === "하교");
        } else if (activeTab === "reports") {
            return attendance.filter(r => r.type === "지각" || r.type === "결석");
        }
        return attendance;
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center p-8 h-screen bg-slate-50">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            </div>
        );
    }

    return (
        <main className="flex-1 flex flex-col bg-slate-50 min-h-screen">
            {/* Admin Nav */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                        <LayoutDashboard size={18} />
                    </div>
                    <h1 className="font-bold text-lg">교사용 관리 페이지</h1>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"><Search size={20} /></button>
                    <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"><Settings size={20} /></button>
                </div>
            </div>

            {/* Summary Chips */}
            <div className="p-6 grid grid-cols-3 gap-4 text-center">
                <SummaryCard label="총 인원" value={`${totalStudents}명`} icon={<Users className="text-blue-500" />} />
                <SummaryCard label="등교 기록" value={`${todayArrivals}건`} icon={<CheckCircle2 className="text-green-500" />} />
                <SummaryCard label="대기 신고" value={`${pendingReports}건`} icon={<AlertCircle className="text-orange-500" />} />
            </div>

            {/* Tabs */}
            <div className="px-6 flex gap-6 border-b border-gray-200 bg-white">
                <TabButton active={activeTab === 'attendance'} onClick={() => setActiveTab('attendance')} label="출결 기록" />
                <TabButton active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} label="지각/결석 신고" />
                <TabButton active={activeTab === 'surveys'} onClick={() => setActiveTab('surveys')} label="전체 내역" />
            </div>

            {/* Content Area */}
            <div className="p-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-bold text-gray-700 flex items-center gap-2">
                            <FileSpreadsheet size={16} className="text-emerald-600" />
                            {activeTab === 'attendance' ? '등하교 기록' : activeTab === 'reports' ? '미출결 신고' : '모든 기록'}
                        </h3>
                        <a
                            href={process.env.NEXT_PUBLIC_SHEET_URL || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-indigo-600 flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-indigo-100 shadow-sm"
                        >
                            <Download size={14} /> Google Sheets 열기
                        </a>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500 uppercase text-[10px] tracking-wider font-bold">
                                    <th className="px-6 py-4">시각</th>
                                    <th className="px-6 py-4">학번</th>
                                    <th className="px-6 py-4">이름</th>
                                    <th className="px-6 py-4">유형</th>
                                    <th className="px-6 py-4">상태/사유</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredRecords().map((record, i) => (
                                    <TableRow
                                        key={i}
                                        time={new Date(record.timestamp).toLocaleString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                        id={record.studentid}
                                        name={record.name}
                                        type={record.type}
                                        status={record.status}
                                        reason={record.reason}
                                    />
                                ))}
                                {filteredRecords().length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-10 text-center text-gray-400">데이터가 없습니다.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Float Button for Manual QR */}
            <Link href="/admin/qr" className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 transition-transform">
                <ExternalLink size={24} />
            </Link>
        </main>
    );
}

function SummaryCard({ label, value, icon }: any) {
    return (
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-1">
            <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider font-mono">{label}</span>
                {icon}
            </div>
            <span className="text-xl font-bold text-gray-800">{value}</span>
        </div>
    );
}

function TabButton({ active, onClick, label }: any) {
    return (
        <button
            onClick={onClick}
            className={`py-4 text-sm font-semibold transition-all relative ${active ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
                }`}
        >
            {label}
            {active && (
                <motion.div
                    layoutId="tab-underline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"
                />
            )}
        </button>
    );
}

function TableRow({ time, id, name, type, status, reason }: any) {
    const statusColor = status === "CONFIRMED" ? "text-green-600 bg-green-50" : status === "REJECTED" ? "text-red-600 bg-red-50" : "text-orange-600 bg-orange-50";

    return (
        <tr className="hover:bg-gray-50/50 transition-colors border-b border-gray-50 last:border-0">
            <td className="px-6 py-4 text-gray-400 font-mono text-xs">{time}</td>
            <td className="px-6 py-4 font-medium text-gray-600">{id}</td>
            <td className="px-6 py-4 font-bold text-gray-800">{name}</td>
            <td className="px-6 py-4 font-semibold text-indigo-600">{type}</td>
            <td className="px-6 py-4">
                <div className="flex flex-col gap-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold w-fit ${statusColor}`}>
                        {status === "CONFIRMED" ? <CheckCircle2 size={10} /> : status === "REJECTED" ? <AlertCircle size={10} /> : <Clock size={10} />}
                        {status}
                    </span>
                    {reason && <span className="text-[11px] text-gray-500 italic">{reason}</span>}
                </div>
            </td>
        </tr>
    );
}
