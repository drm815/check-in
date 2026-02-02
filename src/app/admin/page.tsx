"use client";

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
    Loader2,
    RefreshCw,
    X
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<"attendance" | "reports" | "announcements">("attendance");
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState<any[]>([]);
    const [attendance, setAttendance] = useState<any[]>([]);
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [refreshKey, setRefreshKey] = useState(0);

    // Form state for new announcement
    const [showAnnForm, setShowAnnForm] = useState(false);
    const [editingAnnId, setEditingAnnId] = useState<string | null>(null);
    const [newAnn, setNewAnn] = useState({ title: "", content: "", category: "공지" });
    const router = useRouter();

    const fetchData = async () => {
        setLoading(true);
        try {
            // Add timestamp to bust any cache
            const ts = Date.now();
            const [studentsRes, attendanceRes] = await Promise.all([
                fetch(`/api/students?v=${ts}`),
                fetch(`/api/admin/attendance?v=${ts}`)
            ]);

            if (studentsRes.ok) {
                const sData = await studentsRes.json();
                setStudents(sData);
            }
            if (attendanceRes.ok) {
                const aData = await attendanceRes.json();
                console.log("Attendance Data Received:", aData); // Debugging
                setAttendance(aData);
            }

            // Fetch announcements
            const annRes = await fetch(`/api/announcements?v=${ts}`);
            if (annRes.ok) {
                const annData = await annRes.json();
                setAnnouncements(annData);
            }
        } catch (err) {
            console.error("Failed to fetch admin data", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddAnn = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const action = editingAnnId ? "updateAnnouncement" : "addAnnouncement";
            const res = await fetch("/api/announcements", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...newAnn, action, id: editingAnnId })
            });
            if (res.ok) {
                setNewAnn({ title: "", content: "", category: "공지" });
                setShowAnnForm(false);
                setEditingAnnId(null);
                setRefreshKey(prev => prev + 1);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteAnn = async (id: string) => {
        if (!confirm("정말 삭제하시겠습니까?")) return;
        try {
            const res = await fetch("/api/announcements", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "deleteAnnouncement", id })
            });
            if (res.ok) {
                setRefreshKey(prev => prev + 1);
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        const adminLogin = sessionStorage.getItem("admin_login");
        if (!adminLogin) {
            router.push("/admin/login");
            return;
        }
        fetchData();
    }, [refreshKey]);

    // Derived data
    const totalStudents = students.length;

    // Helper to get value from record regardless of key casing or Korean/English
    const getVal = (r: any, keys: string[]) => {
        for (const key of keys) {
            if (r[key] !== undefined) return String(r[key]).trim();
        }
        return "";
    };

    // Helper to check if a record is from today
    const isToday = (ts: any) => {
        if (!ts) return false;
        const d = new Date(ts);
        const today = new Date();
        return d.getFullYear() === today.getFullYear() &&
            d.getMonth() === today.getMonth() &&
            d.getDate() === today.getDate();
    };

    const todayRecords = attendance.filter(r => isToday(getVal(r, ["timestamp", "시각", "타임스탬프"])));

    const todayArrivals = todayRecords.filter(r => getVal(r, ["type", "유형"]) === "등교").length;
    const pendingReports = todayRecords.filter(r => {
        const type = getVal(r, ["type", "유형"]);
        const status = getVal(r, ["status", "상태"]).toUpperCase();

        // It's a report (not attendance) AND it's pending/not marked as finished
        const isReport = type !== "" && type !== "등교" && type !== "하교";
        const isPending = status === "PENDING" || status === "대기" || status === "";

        return isReport && isPending;
    }).length;

    const filteredRecords = () => {
        if (activeTab === "attendance") {
            return attendance.filter(r => {
                const t = getVal(r, ["type", "유형"]);
                return t === "등교" || t === "하교";
            });
        } else if (activeTab === "reports") {
            return attendance.filter(r => {
                const t = getVal(r, ["type", "유형"]);
                return t !== "" && t !== "등교" && t !== "하교";
            });
        }
        return attendance.filter(r => {
            const t = getVal(r, ["type", "유형"]);
            return t !== "" && t !== "등교" && t !== "하교";
        });
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
                    <button
                        onClick={() => setRefreshKey(prev => prev + 1)}
                        className={`p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-transform ${loading ? 'animate-spin text-indigo-600' : ''}`}
                    >
                        <RefreshCw size={20} />
                    </button>
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
                <TabButton active={activeTab === 'announcements'} onClick={() => setActiveTab('announcements')} label="공지 관리" />
            </div>

            {/* Content Area */}
            <div className="p-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-bold text-gray-700 flex items-center gap-2">
                            <FileSpreadsheet size={16} className="text-emerald-600" />
                            {activeTab === 'attendance' ? '등하교 기록' : activeTab === 'reports' ? '미출결 신고' : '공지사항 관리'}
                        </h3>
                        {process.env.NEXT_PUBLIC_SHEET_URL && (
                            <a
                                href={process.env.NEXT_PUBLIC_SHEET_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-semibold text-indigo-600 flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-indigo-100 shadow-sm"
                            >
                                <Download size={14} /> Google Sheets 열기
                            </a>
                        )}
                    </div>

                    {activeTab === 'announcements' ? (
                        <div className="p-4 flex flex-col gap-4">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-bold text-sm text-gray-500">전체 공지 내역</h4>
                                <button
                                    onClick={() => {
                                        if (showAnnForm) {
                                            setEditingAnnId(null);
                                            setNewAnn({ title: "", content: "", category: "공지" });
                                        }
                                        setShowAnnForm(!showAnnForm);
                                    }}
                                    className="text-sm font-bold bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2"
                                >
                                    {showAnnForm ? "취소하기" : "새 공지 등록"}
                                </button>
                            </div>

                            {showAnnForm && (
                                <form onSubmit={handleAddAnn} className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col gap-3 mb-4">
                                    <div className="grid grid-cols-4 gap-3">
                                        <select
                                            value={newAnn.category}
                                            onChange={(e) => setNewAnn({ ...newAnn, category: e.target.value })}
                                            className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                                        >
                                            <option value="공지">공지</option>
                                            <option value="일정">일정</option>
                                            <option value="행사">행사</option>
                                        </select>
                                        <input
                                            type="text"
                                            placeholder="제목을 입력하세요"
                                            value={newAnn.title}
                                            onChange={(e) => setNewAnn({ ...newAnn, title: e.target.value })}
                                            className="col-span-3 px-3 py-2 rounded-lg border border-gray-200 text-sm"
                                            required
                                        />
                                    </div>
                                    <textarea
                                        placeholder="상세 내용을 입력하세요"
                                        value={newAnn.content}
                                        onChange={(e) => setNewAnn({ ...newAnn, content: e.target.value })}
                                        className="px-3 py-2 rounded-lg border border-gray-200 text-sm h-24"
                                        required
                                    />
                                    <button type="submit" className="bg-indigo-600 text-white py-2 rounded-lg font-bold text-sm">
                                        등록하기
                                    </button>
                                </form>
                            )}

                            <div className="space-y-4">
                                {announcements.length === 0 ? (
                                    <p className="text-center py-12 text-gray-400 text-sm">등록된 공지가 없습니다.</p>
                                ) : (
                                    announcements.map((ann) => (
                                        <div
                                            key={ann.id}
                                            className={`p-5 border rounded-2xl transition-all flex justify-between items-start group cursor-pointer ${editingAnnId === ann.id ? 'border-indigo-600 bg-indigo-50/30' : 'border-gray-100 hover:bg-gray-50'
                                                }`}
                                            onClick={() => {
                                                setEditingAnnId(ann.id);
                                                setNewAnn({ title: ann.title, content: ann.content, category: ann.category });
                                                setShowAnnForm(true);
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }}
                                        >
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${ann.category === '일정' ? 'bg-blue-100 text-blue-700' :
                                                        ann.category === '행사' ? 'bg-purple-100 text-purple-700' : 'bg-gray-200 text-gray-700'
                                                        }`}>
                                                        {ann.category}
                                                    </span>
                                                    <h5 className="font-bold text-gray-900 text-lg">{ann.title}</h5>
                                                </div>
                                                <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{ann.content}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-gray-400 font-medium">{ann.date}</span>
                                                    <span className="text-[10px] text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">클릭하여 수정하기</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteAnn(ann.id);
                                                }}
                                                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ) : (
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
                                            time={new Date(getVal(record, ["timestamp", "시각", "타임스탬프"])).toLocaleString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                            id={getVal(record, ["studentid", "학번"])}
                                            name={getVal(record, ["name", "이름"])}
                                            type={getVal(record, ["type", "유형"])}
                                            status={getVal(record, ["status", "상태"])}
                                            reason={getVal(record, ["reason", "사유"])}
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
                    )}
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
                        {status === "PENDING" ? "승인 대기" : status}
                    </span>
                    {reason && <span className="text-[11px] text-gray-500 italic">{reason}</span>}
                </div>
            </td>
        </tr>
    );
}
