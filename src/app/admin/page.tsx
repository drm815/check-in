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
    X,
    QrCode,
    Printer,
    PlusCircle
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
            <div className="bg-white border-b border-gray-200 px-[30px] py-6 flex items-center justify-between sticky top-0 z-50 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#FF4D8D] rounded-xl flex items-center justify-center text-white shadow-lg shadow-pink-100">
                        <LayoutDashboard size={22} />
                    </div>
                    <h1 className="font-black text-xl text-gray-900 tracking-tight">교사용 관리 페이지</h1>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setRefreshKey(prev => prev + 1)}
                        className={`p-2.5 text-gray-500 hover:bg-gray-100 rounded-xl transition-all ${loading ? 'animate-spin text-indigo-600' : ''}`}
                    >
                        <RefreshCw size={22} />
                    </button>
                    <button className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-xl transition-all"><Settings size={22} /></button>
                </div>
            </div>

            <div className="max-w-5xl mx-auto w-full flex flex-col gap-16 pt-[20vh] pb-12 px-0 sm:px-6">
                {/* Summary Chips */}
                <div className="px-[30px] grid grid-cols-1 md:grid-cols-3 gap-6">
                    <SummaryCard label="총 인원" value={`${totalStudents}명`} icon={<Users className="text-blue-500" />} />
                    <SummaryCard label="실시간 등교" value={`${todayArrivals}건`} icon={<CheckCircle2 className="text-green-500" />} />
                    <SummaryCard label="대기 중인 신고" value={`${pendingReports}건`} icon={<AlertCircle className="text-orange-500" />} />
                </div>

                {/* Tabs - Centered */}
                <div className="mx-[30px] flex justify-center gap-12 border-b-2 border-gray-100">
                    <TabButton active={activeTab === 'attendance'} onClick={() => setActiveTab('attendance')} label="출결 기록" />
                    <TabButton active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} label="결석/지각 신고" />
                    <TabButton active={activeTab === 'announcements'} onClick={() => setActiveTab('announcements')} label="공지 관리" />
                </div>

                {/* Content Area */}
                <div className="px-[30px] pb-20">
                    {/* Centered QR Button Above the Content Box */}
                    <div className="flex justify-end mb-6">
                        <Link
                            href="/admin/qr"
                            className="text-base font-black text-rose-600 flex items-center gap-2 bg-rose-50 px-8 py-4 rounded-2xl border-2 border-rose-100 shadow-sm hover:bg-rose-100 transition-all active:scale-95"
                        >
                            <Printer size={20} /> QR코드 인쇄하기
                        </Link>
                    </div>

                    <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-gray-100 overflow-hidden">
                        <div className="p-8 border-b border-gray-50 flex justify-center items-center bg-white relative">
                            <h3 className="font-black text-gray-900 text-2xl flex items-center gap-3">
                                {activeTab === 'attendance' ? '출결 현황 내역' : activeTab === 'reports' ? '미출결 신고 접수' : '공지사항 게시판'}
                            </h3>
                            {process.env.NEXT_PUBLIC_SHEET_URL && (
                                <div className="absolute right-8">
                                    <a
                                        href={process.env.NEXT_PUBLIC_SHEET_URL}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm font-black text-indigo-600 flex items-center gap-2 bg-indigo-50 px-5 py-2.5 rounded-xl border-2 border-indigo-100 shadow-sm hover:bg-indigo-100 transition-all"
                                    >
                                        <Download size={16} /> 구글 시트
                                    </a>
                                </div>
                            )}
                        </div>

                        {activeTab === 'announcements' ? (
                            <div className="p-8 flex flex-col gap-8">
                                <div className="flex justify-between items-center bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                                    <div className="flex flex-col">
                                        <h4 className="font-extrabold text-lg text-slate-800 tracking-tight">게시판 관리</h4>
                                        <p className="text-slate-500 text-sm font-medium">학생들에게 보여줄 공지를 관리하세요.</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (showAnnForm) {
                                                setEditingAnnId(null);
                                                setNewAnn({ title: "", content: "", category: "공지" });
                                            }
                                            setShowAnnForm(!showAnnForm);
                                        }}
                                        className={`px-8 py-4 rounded-[1.2rem] font-black tracking-tight transition-all flex items-center gap-3 text-base shadow-lg ${showAnnForm ? 'bg-white border-2 border-slate-200 text-slate-500' : 'bg-[#FFD600] text-[#191919] shadow-yellow-100 hover:scale-105 active:scale-95'}`}
                                    >
                                        {showAnnForm ? <X size={20} /> : <PlusCircle size={20} />}
                                        {showAnnForm ? "닫기" : "새 공지 등록"}
                                    </button>
                                </div>

                                {showAnnForm && (
                                    <form onSubmit={handleAddAnn} className="bg-white p-8 rounded-[2rem] border-2 border-indigo-100 flex flex-col gap-6 shadow-inner animate-fade">
                                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                            <select
                                                value={newAnn.category}
                                                onChange={(e) => setNewAnn({ ...newAnn, category: e.target.value })}
                                                className="w-full h-[58px] bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 text-base font-bold text-slate-700 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/5 transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="공지">공지사항</option>
                                                <option value="일정">주요일정</option>
                                                <option value="행사">학교행사</option>
                                            </select>
                                            <input
                                                type="text"
                                                placeholder="제목을 입력하세요"
                                                value={newAnn.title}
                                                onChange={(e) => setNewAnn({ ...newAnn, title: e.target.value })}
                                                className="col-span-1 sm:col-span-3 h-[58px] bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 text-base font-bold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                                                required
                                            />
                                        </div>
                                        <textarea
                                            placeholder="상세 내용을 입력하세요"
                                            value={newAnn.content}
                                            onChange={(e) => setNewAnn({ ...newAnn, content: e.target.value })}
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-5 text-base font-medium text-slate-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/5 transition-all min-h-[160px]"
                                            required
                                        />
                                        <div className="flex justify-end gap-3">
                                            <button
                                                type="button"
                                                onClick={() => { setShowAnnForm(false); setEditingAnnId(null); }}
                                                className="px-8 py-3.5 rounded-2xl border-2 border-slate-100 font-bold text-slate-500 hover:bg-slate-50 transition-all"
                                            >
                                                취소
                                            </button>
                                            <button type="submit" className="px-10 py-3.5 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 hover:scale-105 active:scale-95 transition-all">
                                                {editingAnnId ? "수정 완료" : "업로드 하기"}
                                            </button>
                                        </div>
                                    </form>
                                )}

                                <div className="space-y-6">
                                    {announcements.length === 0 ? (
                                        <div className="py-20 text-center flex flex-col items-center gap-4 border-2 border-dashed border-slate-100 rounded-[2.5rem]">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                                                <PlusCircle size={32} />
                                            </div>
                                            <p className="text-slate-400 font-bold">등록된 공지가 없습니다. 첫 공지를 등록해 보세요.</p>
                                        </div>
                                    ) : (
                                        announcements.map((ann) => (
                                            <div
                                                key={ann.id}
                                                className={`p-6 border-2 rounded-[2rem] transition-all flex justify-between items-start group hover:shadow-lg hover:shadow-slate-100 cursor-pointer ${editingAnnId === ann.id ? 'border-indigo-500 bg-indigo-50/20' : 'border-slate-50 bg-white hover:border-slate-100'
                                                    }`}
                                                onClick={() => {
                                                    setEditingAnnId(ann.id);
                                                    setNewAnn({ title: ann.title, content: ann.content, category: ann.category });
                                                    setShowAnnForm(true);
                                                    window.scrollTo({ top: 400, behavior: 'smooth' });
                                                }}
                                            >
                                                <div className="flex flex-col gap-4">
                                                    <div className="flex items-center gap-3">
                                                        <span className={`text-[11px] px-4 py-1.5 rounded-full font-black uppercase tracking-widest ${ann.category === '일정' ? 'bg-blue-100 text-blue-700' :
                                                            ann.category === '행사' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'
                                                            }`}>
                                                            {ann.category}
                                                        </span>
                                                        <h5 className="font-black text-gray-900 text-xl tracking-tight leading-none pt-1">{ann.title}</h5>
                                                    </div>
                                                    <p className="text-slate-600 font-medium whitespace-pre-wrap leading-relaxed px-1">{ann.content}</p>
                                                    <div className="flex items-center gap-4 px-1 mt-1">
                                                        <span className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
                                                            <Clock size={14} /> {ann.date}
                                                        </span>
                                                        <span className="text-[11px] text-indigo-500 font-black opacity-0 group-hover:opacity-100 transition-opacity">클릭하여 수정</span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteAnn(ann.id);
                                                    }}
                                                    className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                                >
                                                    <X size={22} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead>
                                        <tr className="bg-slate-50/80 text-slate-400 uppercase text-xs tracking-[0.2em] font-black">
                                            <th className="px-20 py-6">시각</th>
                                            <th className="px-10 py-6">학번</th>
                                            <th className="px-10 py-6">이름</th>
                                            <th className="px-10 py-6">유형</th>
                                            <th className="px-10 py-6">상태/사유</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
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
                                                <td colSpan={5} className="px-10 py-24 text-center">
                                                    <div className="flex flex-col items-center gap-4">
                                                        <div className="p-4 bg-slate-50 rounded-full text-slate-300">
                                                            <Search size={32} />
                                                        </div>
                                                        <p className="font-bold text-slate-400">데이터가 존재하지 않습니다.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Float Button for Manual QR */}
            <Link href="/admin/qr" className="fixed bottom-10 right-10 w-16 h-16 bg-[#FF4D8D] text-white rounded-[1.5rem] shadow-[0_15px_30px_-5px_rgba(255,77,141,0.4)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-[100]">
                <QrCode size={28} />
            </Link>
        </main>
    );
}

function SummaryCard({ label, value, icon }: any) {
    return (
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl shadow-slate-200/30 flex flex-col gap-4 group hover:border-indigo-100 transition-all">
            <div className="flex justify-between items-center">
                <span className="text-[11px] uppercase font-black text-slate-400 tracking-[0.2em]">{label}</span>
                <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-indigo-50 transition-colors">
                    {icon}
                </div>
            </div>
            <span className="text-3xl font-black text-slate-900 tracking-tight">{value}</span>
        </div>
    );
}

function TabButton({ active, onClick, label }: any) {
    return (
        <button
            onClick={onClick}
            className={`py-6 text-base font-black transition-all relative ${active ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                }`}
        >
            {label}
            {active && (
                <motion.div
                    layoutId="tab-underline"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-full"
                />
            )}
        </button>
    );
}

function TableRow({ time, id, name, type, status, reason }: any) {
    const isReport = type !== "등교" && type !== "하교";
    const statusColor = status === "CONFIRMED" ? "text-green-600 bg-green-50 border-green-100" :
        status === "REJECTED" ? "text-rose-600 bg-rose-50 border-rose-100" :
            "text-orange-600 bg-orange-50 border-orange-100";

    return (
        <tr className="hover:bg-slate-50/50 transition-all group">
            <td className="px-20 py-6 text-slate-400 font-mono text-sm">{time}</td>
            <td className="px-10 py-6 font-bold text-slate-500">{id}</td>
            <td className="px-10 py-6 font-black text-slate-900 text-base">{name}</td>
            <td className="px-10 py-6">
                <span className={`px-4 py-1.5 rounded-full text-xs font-black tracking-widest ${type === '등교' ? 'bg-emerald-50 text-emerald-600' : type === '하교' ? 'bg-sky-50 text-sky-600' : 'bg-indigo-50 text-indigo-600'}`}>
                    {type}
                </span>
            </td>
            <td className="px-10 py-6">
                <div className="flex flex-col gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black w-fit border-2 ${statusColor}`}>
                        {status === "CONFIRMED" ? <CheckCircle2 size={12} /> : status === "REJECTED" ? <AlertCircle size={12} /> : <Clock size={12} />}
                        {status === "PENDING" || status === "대기" || status === "" ? "승인 대기 중" : status}
                    </span>
                    {reason && <span className="text-xs text-slate-500 font-medium italic opacity-70">" {reason} "</span>}
                </div>
            </td>
        </tr>
    );
}
