"use client";

import { useState, useEffect } from "react";
import {
    LayoutDashboard,
    RefreshCw,
    PlusCircle,
    X,
    ChevronDown,
    Trash2,
    Download,
    Printer,
    Search,
    Users,
    CheckCircle2,
    AlertCircle,
    Clock,
    Loader2,
    Calendar,
    ArrowRight,
    MessageSquare,
    Bell,
    ChevronRight,
    MoreHorizontal,
    Edit3,
    Plus,
    Settings
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<'attendance' | 'reports' | 'announcements' | 'missing'>('announcements');
    const [records, setRecords] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);

    // Date Filter State (Default: Today in local time)
    const [selectedDate, setSelectedDate] = useState(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    });
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [showAnnForm, setShowAnnForm] = useState(true);
    const [newAnn, setNewAnn] = useState({ title: "", content: "", category: "공지" });
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [editingAnnId, setEditingAnnId] = useState<string | null>(null);
    const [selectedStudent, setSelectedStudent] = useState<{ id: string, name: string } | null>(null);
    const [selectedMissingStudents, setSelectedMissingStudents] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 7;

    const router = useRouter();

    useEffect(() => {
        const adminId = sessionStorage.getItem("admin_id");
        if (!adminId) {
            router.push("/admin/login");
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                const [attRes, annRes, stuRes] = await Promise.all([
                    fetch(`/api/admin/attendance?v=${Date.now()}`),
                    fetch(`/api/announcements?v=${Date.now()}`),
                    fetch("/api/students")
                ]);

                if (attRes.ok) {
                    const data = await attRes.json();
                    setRecords(data);
                }
                if (annRes.ok) {
                    const data = await annRes.json();
                    setAnnouncements(data);
                }
                if (stuRes.ok) {
                    const data = await stuRes.json();
                    setStudents(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [refreshKey, router]);

    const handleAddAnn = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = editingAnnId ? `/api/announcements/${editingAnnId}` : "/api/announcements";
        const method = editingAnnId ? "PUT" : "POST";

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newAnn),
            });
            if (res.ok) {
                alert(editingAnnId ? "공지사항이 수정되었습니다." : "공지사항이 등록되었습니다.");
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
            const res = await fetch(`/api/announcements/${id}`, { method: "DELETE" });
            if (res.ok) setRefreshKey(prev => prev + 1);
        } catch (err) {
            console.error(err);
        }
    };

    const handleManualCheckIn = async (studentId: string, name: string) => {
        if (!confirm(`${name} 학생을 '등교' 처리하시겠습니까?`)) return;
        try {
            const res = await fetch('/api/admin/manual-checkin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId, name, targetDate: selectedDate }),
            });
            if (res.ok) {
                alert('처리되었습니다.');
                setRefreshKey(prev => prev + 1);
            } else {
                alert('오류가 발생했습니다.');
            }
        } catch (err) {
            console.error(err);
            alert('오류가 발생했습니다.');
        }
    };

    const handleBulkCheckIn = async () => {
        if (selectedMissingStudents.length === 0) {
            alert("선택된 학생이 없습니다.");
            return;
        }
        if (!confirm(`${selectedMissingStudents.length}명의 학생을 일괄 등교 처리하시겠습니까?`)) return;

        setLoading(true);
        let successCount = 0;
        let failCount = 0;

        for (const id of selectedMissingStudents) {
            const student = students.find(s => s.id.toString() === id.toString());
            if (!student) continue;

            try {
                const res = await fetch('/api/admin/manual-checkin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ studentId: student.id, name: student.name, targetDate: selectedDate }),
                });
                if (res.ok) successCount++;
                else failCount++;
            } catch (e) {
                failCount++;
            }
        }

        setLoading(false);
        alert(`처리 완료: 성공 ${successCount}건, 실패 ${failCount}건`);
        setSelectedMissingStudents([]);
        setRefreshKey(prev => prev + 1);
    };

    const toggleMissingStudent = (id: string) => {
        setSelectedMissingStudents(prev =>
            prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]
        );
    };

    const toggleAllMissingStudents = (currentIds: string[]) => {
        const allSelected = currentIds.every(id => selectedMissingStudents.includes(id));
        if (allSelected) {
            setSelectedMissingStudents(prev => prev.filter(id => !currentIds.includes(id)));
        } else {
            const newSelected = [...selectedMissingStudents];
            currentIds.forEach(id => {
                if (!newSelected.includes(id)) newSelected.push(id);
            });
            setSelectedMissingStudents(newSelected);
        }
    };

    const getVal = (obj: any, keys: string[]) => {
        for (const key of keys) {
            if (obj[key] !== undefined) return obj[key];
        }
        return "";
    };

    // Helper to get date string YYYY-MM-DD from various inputs
    const getDateString = (dateInput: any) => {
        if (!dateInput) return "";
        if (typeof dateInput === 'string' && dateInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return dateInput;
        }
        try {
            const d = new Date(dateInput);
            if (isNaN(d.getTime())) return "";
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch (e) {
            return "";
        }
    };

    const filteredRecords = () => {
        let base = records;

        // 1. Filter by SELECTED DATE
        base = base.filter(r => {
            const tDate = getVal(r, ["targetdate", "대상날짜", "targetDate"]);
            const timestamp = getVal(r, ["timestamp", "시각"]);

            // Priority: TargetDate > Timestamp
            // If there is a targetDate (for reports mainly), use it. otherwise timestamp.
            const recordDateStr = tDate ? getDateString(tDate) : getDateString(timestamp);
            return recordDateStr === selectedDate;
        });

        // 2. Filter by TAB
        if (activeTab === 'reports') {
            base = base.filter(r => {
                const type = getVal(r, ["type", "유형"]);
                const isReport = type !== "등교" && type !== "하교";
                return isReport;
            });
        } else if (activeTab === 'attendance') {
            base = base.filter(r => {
                const type = getVal(r, ["type", "유형"]);
                return type === "등교" || type === "하교";
            });
        }

        // 3. Filter by SEARCH QUERY
        if (searchQuery) {
            return base.filter(r =>
                getVal(r, ["name", "이름"]).includes(searchQuery) ||
                getVal(r, ["studentid", "학번"]).toString().includes(searchQuery)
            );
        }
        return base;
    };

    const totalStudents = students.length;

    // Calculate stats based on SELECTED DATE
    const currentDateArrivals = records.filter(r => {
        const type = getVal(r, ["type", "유형"]);
        const timestamp = getVal(r, ["timestamp", "시각"]);
        if (type !== "등교") return false;

        // Use getDateString here too
        return getDateString(timestamp) === selectedDate;
    }).length;

    // Reports are also usually relevant to the date, but "Pending" status might span days.
    // However, requested logic is to filter report details by date.
    // For the counter "Pending Reports", typically admins want to see ALL pending regardless of date to clear backlog.
    // BUT since we added a date filter, maybe this counter should reflect the selected date's pending reports?
    // "대기 중인 신고" generally implies "Backlog". I will keep it as ALL pending for now, or filter by date?
    // User asked: "해당날짜에 신고 내용만 필터링 되어서 세부내역목록에 표시되도록 해줘." -> List is filtered.
    // User also asked: "현황에는 오늘날짜에 해당하는 정보만 카운팅... 전날 미리 신청할 수도 있잖아? 그걸 어떻게 구분하면 좋을까?"
    // Now we have date filter. Let's make "Pending Reports" (in Stats) show count for Selected Date.
    const currentDateReports = records.filter(r => {
        const type = getVal(r, ["type", "유형"]);
        const status = getVal(r, ["status", "상태"]);
        const tDate = getVal(r, ["targetdate", "대상날짜", "targetDate"]);
        const timestamp = getVal(r, ["timestamp", "시각"]);

        const isReport = type !== "등교" && type !== "하교";
        const isPending = (status === "PENDING" || status === "대기" || status === "");

        const recordDateStr = tDate ? getDateString(tDate) : getDateString(timestamp);

        return isReport && isPending && recordDateStr === selectedDate;
    }).length;

    const allFilteredRecords = filteredRecords();

    const handleDownloadCSV = () => {
        if (allFilteredRecords.length === 0) {
            alert("다운로드할 데이터가 없습니다.");
            return;
        }

        const headers = ["날짜", "시간", "학번", "이름", "유형", "상태", "사유"];
        const csvRows = [headers.join(",")];

        for (const record of allFilteredRecords) {
            const date = getVal(record, ["targetdate", "대상날짜", "targetDate"]) || getVal(record, ["timestamp", "시각", "Time"]);
            const timeVal = getVal(record, ["timestamp", "시각", "Time"]);
            const time = timeVal ? new Date(timeVal).toLocaleTimeString('ko-KR') : "";

            const id = getVal(record, ["studentid", "학번", "Student ID"]);
            const name = getVal(record, ["name", "이름", "Name"]);
            const type = getVal(record, ["type", "유형", "Type"]);
            const status = getVal(record, ["status", "상태", "Status"]);
            const reason = getVal(record, ["reason", "사유", "Reason"]);

            const formattedDate = date ? new Date(date).toLocaleDateString('ko-KR').replace(/\. /g, '-').replace('.', '') : "";

            const row = [
                formattedDate,
                time,
                id,
                name,
                type,
                status,
                `"${(reason || '').replace(/"/g, '""')}"` // Escape double quotes
            ];
            csvRows.push(row.join(","));
        }

        const csvString = "\uFEFF" + csvRows.join("\n");
        const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `출결기록_${selectedDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // Calculate Missing Students (No record for selected date)
    const getMissingStudents = () => {
        const recordedIds = new Set(
            records
                .filter(r => {
                    const tDate = getVal(r, ["targetdate", "대상날짜", "targetDate"]);
                    const timestamp = getVal(r, ["timestamp", "시각"]);
                    const rDate = tDate ? getDateString(tDate) : getDateString(timestamp);
                    return rDate === selectedDate;
                })
                .map(r => getVal(r, ["studentid", "학번", "id"]).toString().trim())
        );
        return students.filter(s => !recordedIds.has(s.id.toString().trim()));
    };
    const missingStudentsList = getMissingStudents();
    const missingCount = missingStudentsList.length;

    const dataSource = activeTab === 'missing' ? missingStudentsList : allFilteredRecords;
    const totalPages = Math.ceil(dataSource.length / itemsPerPage);
    const paginatedRecords = dataSource.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        setCurrentPage(1);
        setSelectedMissingStudents([]);
    }, [activeTab, searchQuery, selectedDate]);

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-indigo-100 flex flex-col items-center w-full overflow-x-hidden">
            {/* Hidden Spacer */}
            <div className="h-[20px]" />

            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-50 bg-[#F8FAFC] flex justify-center w-full border-b border-transparent">
                <div className="w-[90%] max-w-[400px] px-4 py-4 flex items-center justify-between box-border mx-auto">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#FF4D8D] rounded-xl flex items-center justify-center text-white shrink-0">
                            <LayoutDashboard size={22} strokeWidth={2.5} />
                        </div>
                        <h1 className="text-xl font-black tracking-tight text-slate-900">교사용 관리 페이지</h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setRefreshKey(prev => prev + 1)}
                            className={`p-2 text-slate-400 hover:text-slate-600 transition-all ${loading ? 'animate-spin' : ''}`}
                        >
                            <RefreshCw size={22} />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-slate-600 transition-all">
                            <Settings size={22} />
                        </button>
                    </div>
                </div>
            </header>
            <div className="h-[10px]" />

            <main className="w-[90%] max-w-[400px] mx-auto flex flex-col gap-10 py-8 sm:py-12 px-4 box-border overflow-x-hidden">



                {/* Date Filter */}
                <div className="flex justify-end mb-2">
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="p-3 rounded-2xl border border-slate-200 bg-white text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-[#FF4D8D]/20 shadow-sm"
                    />
                </div>

                {/* Dashboard Stats */}
                <section className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <StatCard
                        label="총 인원"
                        value={`${totalStudents}명`}
                        icon={<Users size={24} />}
                        color="text-blue-500"
                        bgColor="bg-blue-50"
                        delay={0.1}
                    />
                    <StatCard
                        label="선택일 등교"
                        value={`${currentDateArrivals}건`}
                        icon={<CheckCircle2 size={24} />}
                        color="text-emerald-500"
                        bgColor="bg-emerald-50"
                        delay={0.2}
                    />
                    <StatCard
                        label="대기중 신고"
                        value={`${currentDateReports}건`}
                        icon={<AlertCircle size={24} />}
                        color="text-amber-500"
                        bgColor="bg-amber-50"
                        delay={0.3}
                    />
                    <StatCard
                        label="미출석"
                        value={`${missingCount}명`}
                        icon={<AlertCircle size={24} />}
                        color="text-rose-500"
                        bgColor="bg-rose-50"
                        delay={0.4}
                    />
                </section>

                <div className="flex flex-col gap-10">
                    {/* Tab Switcher */}
                    <nav className="grid grid-cols-4 w-full border-b border-slate-100">
                        <TabTrigger
                            active={activeTab === 'attendance'}
                            onClick={() => setActiveTab('attendance')}
                            label="출결 기록"
                        />
                        <TabTrigger
                            active={activeTab === 'reports'}
                            onClick={() => setActiveTab('reports')}
                            label="결석/지각 신고"
                        />
                        <TabTrigger
                            active={activeTab === 'missing'}
                            onClick={() => setActiveTab('missing')}
                            label="미출석 관리"
                        />
                        <TabTrigger
                            active={activeTab === 'announcements'}
                            onClick={() => setActiveTab('announcements')}
                            label="공지 관리"
                        />
                    </nav>

                    {/* Content Section */}
                    <div className="flex flex-col gap-10">


                        <div className="w-full bg-[#F8FAFC] rounded-none px-0 py-10 min-h-[500px]">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {activeTab === 'missing' ? (
                                        <div className="flex flex-col gap-4">
                                            {missingStudentsList.length > 0 && (
                                                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 mb-2">
                                                    <div className="flex items-center gap-4">
                                                        <input
                                                            type="checkbox"
                                                            checked={paginatedRecords.length > 0 && paginatedRecords.every((s: any) => selectedMissingStudents.includes(s.id.toString()))}
                                                            onChange={() => toggleAllMissingStudents(paginatedRecords.map((s: any) => s.id.toString()))}
                                                            className="w-5 h-5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                        />
                                                        <span className="font-bold text-slate-600 text-sm">전체 선택 ({paginatedRecords.length}명)</span>
                                                    </div>
                                                    <button
                                                        onClick={handleBulkCheckIn}
                                                        disabled={selectedMissingStudents.length === 0}
                                                        className="px-5 py-2 bg-indigo-600 text-white rounded-lg font-bold text-xs hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-100 ml-4"
                                                    >
                                                        일괄 등교
                                                    </button>
                                                </div>
                                            )}

                                            {missingStudentsList.length === 0 ? (
                                                <div className="text-center py-20 text-slate-400 font-bold">
                                                    모든 학생이 출석했습니다! 🎉
                                                </div>
                                            ) : (
                                                <div className="flex flex-col">
                                                    {paginatedRecords.map((student: any, i: number) => (
                                                        <motion.div
                                                            key={student.id}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: i * 0.05 }}
                                                            className={`px-6 py-4 flex items-center justify-between group transition-all cursor-pointer border-b border-slate-100 last:border-none ${selectedMissingStudents.includes(student.id.toString()) ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}`}
                                                            onClick={() => toggleMissingStudent(student.id.toString())}
                                                        >
                                                            <div className="flex items-center gap-6">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedMissingStudents.includes(student.id.toString())}
                                                                    onChange={() => toggleMissingStudent(student.id.toString())}
                                                                    className="w-5 h-5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                />
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 font-black text-sm">
                                                                        {student.id.toString().slice(-2)}
                                                                    </div>
                                                                    <div className="flex flex-col leading-tight">
                                                                        <span className="text-base font-black text-slate-900">{student.name}</span>
                                                                        <span className="text-xs font-bold text-slate-400">{student.id}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleManualCheckIn(student.id, student.name);
                                                                }}
                                                                className="px-5 py-2 bg-indigo-50 text-indigo-600 rounded-lg font-bold text-xs hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95 whitespace-nowrap ml-4"
                                                            >
                                                                등교
                                                            </button>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : activeTab === 'announcements' ? (
                                        <div className="flex flex-col gap-10">
                                            {!showAnnForm && (
                                                <div className="flex justify-center w-full">
                                                    <button
                                                        onClick={() => { setShowAnnForm(true); setEditingAnnId(null); }}
                                                        className="flex items-center justify-center gap-1 px-10 py-4 bg-[#FF4D8D] text-white rounded-2xl font-black text-lg hover:scale-105 transition-all shadow-lg shadow-pink-100 whitespace-nowrap"
                                                    >
                                                        <Plus size={24} /> 등록하기
                                                    </button>
                                                </div>
                                            )}

                                            {showAnnForm && (
                                                <motion.form
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    onSubmit={handleAddAnn}
                                                    className="flex flex-col gap-8"
                                                >
                                                    <div className="flex flex-col gap-4">
                                                        <div className="w-full h-[68px] premium-card rounded-[2.5rem] px-8 !py-0 flex items-center relative">
                                                            <span className="text-xl mr-2 shrink-0">📢</span>
                                                            <select
                                                                value={newAnn.category}
                                                                onChange={(e) => setNewAnn({ ...newAnn, category: e.target.value })}
                                                                className="w-full h-full bg-transparent font-black text-slate-600 outline-none appearance-none cursor-pointer text-lg pl-4"
                                                            >
                                                                <option value="공지">공지사항</option>
                                                                <option value="일정">주요일정</option>
                                                                <option value="행사">특별행사</option>
                                                            </select>
                                                            <div className="absolute right-8 pointer-events-none">
                                                                <ChevronDown size={20} className="text-slate-300" />
                                                            </div>
                                                        </div>
                                                        <div className="w-full h-[68px] premium-card rounded-[2.5rem] px-8 !py-0 flex items-center">
                                                            <input
                                                                type="text"
                                                                placeholder="공지 제목을 입력하세요"
                                                                value={newAnn.title}
                                                                onChange={(e) => setNewAnn({ ...newAnn, title: e.target.value })}
                                                                className="w-full bg-transparent font-black text-slate-900 outline-none text-lg placeholder:text-slate-400 pl-4"
                                                                required
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="premium-card rounded-[2.5rem] p-8">
                                                        <textarea
                                                            placeholder="상세 내용을 입력해 주세요. 학생들에게 이 내용이 전달됩니다."
                                                            value={newAnn.content}
                                                            onChange={(e) => setNewAnn({ ...newAnn, content: e.target.value })}
                                                            className="w-full min-h-[150px] bg-transparent font-bold text-slate-600 outline-none text-xl placeholder:text-slate-400 resize-none leading-relaxed pl-4"
                                                            required
                                                        />
                                                    </div>

                                                    <div className="flex flex-row items-center justify-center gap-4 mt-6">
                                                        <button
                                                            type="button"
                                                            onClick={() => { setShowAnnForm(false); setEditingAnnId(null); }}
                                                            className="w-[45%] h-[68px] bg-slate-100 text-slate-400 rounded-[2rem] font-black text-lg hover:bg-slate-200 hover:text-slate-600 transition-all active:scale-95"
                                                        >
                                                            취소
                                                        </button>
                                                        <button type="submit" className="w-[45%] h-[68px] bg-[#FF4D8D] text-white rounded-[2rem] font-black text-lg hover:scale-105 transition-all active:scale-95 shadow-lg shadow-pink-100">
                                                            업로드
                                                        </button>
                                                    </div>
                                                </motion.form>
                                            )}

                                            <div className="grid grid-cols-1 gap-6 mt-4">
                                                {announcements.map((ann, i) => (
                                                    <motion.div
                                                        key={ann.id}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: i * 0.05 }}
                                                        className="premium-card p-8 rounded-[2.5rem] shadow-sm hover:shadow-md hover:border-indigo-100 transition-all flex flex-col gap-4 group h-full cursor-pointer relative"
                                                    >
                                                        {/* Floating Edit Actions */}
                                                        <div className="absolute top-6 right-6 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all z-10 bg-white/90 backdrop-blur-sm p-1.5 rounded-xl border border-slate-100 shadow-sm">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation(); // Prevent card click
                                                                    setEditingAnnId(ann.id);
                                                                    setNewAnn({ title: ann.title, content: ann.content, category: ann.category });
                                                                    setShowAnnForm(true);
                                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                                }}
                                                                className="p-2 text-slate-400 hover:text-[#FF4D8D] transition-colors"
                                                            >
                                                                <Edit3 size={18} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation(); // Prevent card click
                                                                    handleDeleteAnn(ann.id);
                                                                }}
                                                                className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>

                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3 overflow-hidden">
                                                                <span className={`px-3 py-1 rounded-full text-xs font-black shrink-0 ${ann.category === '공지' ? 'bg-pink-50 text-[#FF4D8D]' :
                                                                    ann.category === '일정' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'
                                                                    }`}>
                                                                    {ann.category}
                                                                </span>
                                                                <h5 className="font-black text-xl text-gray-800 group-hover:text-indigo-600 transition-colors line-clamp-1 tracking-tight truncate">
                                                                    {ann.title}
                                                                </h5>
                                                            </div>
                                                            <span className="text-xs font-bold text-gray-400 shrink-0">
                                                                {ann.date ? new Date(ann.date).toLocaleDateString() : ""}
                                                            </span>
                                                        </div>

                                                        <p className="text-base text-gray-500 line-clamp-2 leading-relaxed font-medium opacity-80">
                                                            {ann.content}
                                                        </p>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-8">
                                            <div className="flex flex-row items-center gap-3">
                                                <div className="relative flex-1">
                                                    <input
                                                        type="text"
                                                        placeholder="학생 검색..."
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                        className="w-full h-11 bg-slate-50 rounded-xl px-4 text-sm font-bold placeholder:text-slate-300 shadow-sm outline-none focus:ring-2 focus:ring-indigo-100 transition-all border-none text-center"
                                                    />
                                                </div>
                                                <button
                                                    onClick={handleDownloadCSV}
                                                    className="h-11 w-11 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center hover:bg-emerald-100 transition-all shadow-sm active:scale-95"
                                                    title="엑셀 다운로드"
                                                >
                                                    <Download size={20} />
                                                </button>
                                            </div>
                                            <div className="overflow-x-auto no-scrollbar">
                                                <table className="w-full text-center whitespace-nowrap">
                                                    <thead>
                                                        <tr className="text-slate-400 text-[9px] sm:text-[10px] font-black uppercase tracking-wider border-b border-slate-50">
                                                            <th className="px-2 py-3 whitespace-nowrap">시간</th>
                                                            <th className="px-2 py-3 whitespace-nowrap">학번</th>
                                                            <th className="px-2 py-3 whitespace-nowrap">이름</th>
                                                            <th className="px-2 py-3 whitespace-nowrap">유형</th>
                                                            <th className="px-2 py-3 whitespace-nowrap">상태</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-50/50">
                                                        {paginatedRecords.map((record, i) => (
                                                            <TableRow
                                                                key={i}
                                                                record={record}
                                                                getVal={getVal}
                                                                delay={i * 0.03}
                                                                onClick={() => {
                                                                    const name = getVal(record, ["name", "이름"]);
                                                                    const id = getVal(record, ["studentid", "학번"]);
                                                                    setSelectedStudent({ id, name });
                                                                }}
                                                            />
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                        </div>
                                    )}

                                    {/* Pagination Controls - Shared for all list views in this block if needed */}
                                    {(activeTab === 'missing' || activeTab === 'reports' || activeTab === 'attendance') && totalPages > 1 && (
                                        <div className="flex items-center justify-center gap-4 mt-10">
                                            <button
                                                disabled={currentPage === 1}
                                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 transition-all"
                                            >
                                                <ChevronRight size={20} className="rotate-180" />
                                            </button>
                                            <div className="px-4 py-2 bg-slate-50 rounded-xl">
                                                <span className="text-sm font-black text-slate-900">{currentPage}</span>
                                                <span className="text-sm font-bold text-slate-300 mx-1">/</span>
                                                <span className="text-sm font-bold text-slate-400">{totalPages}</span>
                                            </div>
                                            <button
                                                disabled={currentPage === totalPages}
                                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 transition-all"
                                            >
                                                <ChevronRight size={20} />
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <footer className="flex items-center justify-center mt-[-30px] pb-10">
                    <Link href="/admin/qr" className="flex items-center gap-3 px-16 py-6 bg-white border border-slate-100 rounded-2xl text-slate-700 font-black text-lg hover:bg-slate-50 hover:border-indigo-100 transition-all active:scale-95 shadow-md shadow-slate-100">
                        <Printer size={24} className="text-indigo-600" />
                        QR 코드 인쇄하기
                    </Link>
                </footer>

                {/* Student Detail Modal */}
                <AnimatePresence>
                    {selectedStudent && (
                        <StudentDetailModal
                            student={selectedStudent}
                            records={records.filter(r => getVal(r, ["studentid", "학번", "id"]).toString().trim() === selectedStudent.id.toString().trim())}
                            onClose={() => setSelectedStudent(null)}
                            getVal={getVal}
                        />
                    )}
                </AnimatePresence>
            </main >
        </div >
    );
}

function StatCard({ label, value, icon, color, bgColor, delay }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="bg-white p-3 sm:p-6 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-3 group hover:translate-y-[-4px] transition-all"
        >
            <div className={`w-10 h-10 sm:w-14 sm:h-14 ${bgColor} ${color} rounded-full flex items-center justify-center transition-all group-hover:scale-110 shadow-sm border border-slate-50`}>
                {icon}
            </div>
            <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] sm:text-xs font-black text-slate-400 tracking-tight">{label}</span>
                <span className="text-xl sm:text-3xl font-black text-slate-900 tracking-tighter leading-none">{value}</span>
            </div>
        </motion.div>
    );
}

function TabTrigger({ active, onClick, label }: any) {
    return (
        <button
            onClick={onClick}
            className={`w-full py-4 relative font-black text-[11px] sm:text-base transition-all whitespace-nowrap group flex flex-col items-center justify-center ${active ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                }`}
        >
            <span className="tracking-tighter">{label}</span>
            {active && (
                <motion.div
                    layoutId="admin-active-tab"
                    className="absolute bottom-[-1px] left-0 right-0 h-[3px] bg-indigo-600 rounded-t-full"
                />
            )}
        </button>
    );
}

function TableRow({ record, getVal, delay, onClick }: any) {
    const type = getVal(record, ["type", "유형"]);
    const status = getVal(record, ["status", "상태"]);
    const reason = getVal(record, ["reason", "사유"]);
    const name = getVal(record, ["name", "이름"]);
    const studentId = getVal(record, ["studentid", "학번"]);
    const timeVal = getVal(record, ["timestamp", "시각", "타임스탬프"]);
    const time = new Date(timeVal).toLocaleString('ko-KR', { hour: '2-digit', minute: '2-digit' });

    return (
        <motion.tr
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay }}
            className="group hover:bg-slate-50/50 transition-all font-sans cursor-pointer hover:bg-indigo-50/30"
            onClick={onClick}
        >
            <td className="px-2 py-3 text-[10px] sm:text-xs font-mono text-slate-400 whitespace-nowrap">{time}</td>
            <td className="px-2 py-3 text-[11px] sm:text-sm font-bold text-slate-500 whitespace-nowrap">{studentId}</td>
            <td className="px-2 py-3 text-[12px] sm:text-base font-black text-slate-900 whitespace-nowrap">{name}</td>
            <td className="px-2 py-3">
                <span className={`px-2 py-1 rounded-full text-[10px] sm:text-[11px] font-black whitespace-nowrap ${type === '등교' ? 'bg-emerald-50 text-emerald-600' :
                    type === '하교' ? 'bg-sky-50 text-sky-600' : 'bg-indigo-50 text-indigo-600'
                    }`}>
                    {type}
                </span>
            </td>
            <td className="px-2 py-3">
                <div className="flex flex-col items-center gap-1">
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] sm:text-[11px] font-black whitespace-nowrap ${status === "CONFIRMED" || status === "승인" ? "text-emerald-600 bg-emerald-50" :
                        status === "REJECTED" || status === "거절" ? "text-rose-600 bg-rose-50" :
                            "text-amber-600 bg-amber-50"
                        }`}>
                        {status === "CONFIRMED" || status === "승인" ? <CheckCircle2 size={12} strokeWidth={3} /> :
                            status === "REJECTED" || status === "거절" ? <AlertCircle size={12} strokeWidth={3} /> : <Clock size={12} strokeWidth={3} />}
                        {status === "PENDING" || status === "대기" || status === "" ? "대기" : status}
                    </div>
                    {reason && <p className="text-[10px] font-bold text-slate-400 italic opacity-90 truncate max-w-[100px]">" {reason} "</p>}
                </div>
            </td>
        </motion.tr>
    );
}

function StudentDetailModal({ student, records, onClose, getVal }: any) {
    // Sort records by timestamp descending
    const sortedRecords = [...records].sort((a, b) => {
        const tA = new Date(getVal(a, ["timestamp", "시각"])).getTime();
        const tB = new Date(getVal(b, ["timestamp", "시각"])).getTime();
        return tB - tA;
    });

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Filter for current month stats
    const currentMonthRecords = records.filter((r: any) => {
        const d = new Date(getVal(r, ["timestamp", "시각"]));
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const stats = {
        late: currentMonthRecords.filter((r: any) => getVal(r, ["type", "유형"]) === "지각").length,
        absent: currentMonthRecords.filter((r: any) => getVal(r, ["type", "유형"]) === "결석").length,
        early: currentMonthRecords.filter((r: any) => getVal(r, ["type", "유형"]) === "조퇴").length
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white w-full max-w-[350px] max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative"
            >
                {/* Header */}
                <div className="bg-[#FF4D8D]/10 p-8 pb-12 flex flex-col items-center justify-center relative">
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 bg-white/50 hover:bg-white rounded-full text-slate-400 hover:text-slate-600 transition-all"
                    >
                        <X size={20} />
                    </button>
                    <div className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center mb-4 text-4xl">
                        🎓
                    </div>
                    <h2 className="text-2xl font-black text-slate-800">{student.name}</h2>
                    <span className="text-sm font-bold text-slate-500 bg-white/60 px-3 py-1 rounded-full mt-2">
                        {student.id}
                    </span>
                </div>

                {/* Stats Row */}
                <div className="flex flex-col gap-3 -mt-8 px-6 relative z-10 w-full">
                    <div className="flex items-center justify-between px-2">
                        <span className="text-[11px] font-black text-slate-400 bg-slate-100/80 px-2 py-1 rounded-lg">
                            📊 {currentMonth}월 통계
                        </span>
                    </div>
                    <div className="flex items-center justify-center gap-3">
                        <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center w-1/3">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">지각</span>
                            <span className={`text-xl font-black ${stats.late > 0 ? 'text-orange-500' : 'text-slate-300'}`}>{stats.late}</span>
                        </div>
                        <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center w-1/3">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">결석</span>
                            <span className={`text-xl font-black ${stats.absent > 0 ? 'text-rose-500' : 'text-slate-300'}`}>{stats.absent}</span>
                        </div>
                        <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center w-1/3">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">조퇴</span>
                            <span className={`text-xl font-black ${stats.early > 0 ? 'text-purple-500' : 'text-slate-300'}`}>{stats.early}</span>
                        </div>
                    </div>
                </div>

                {/* Timeline - Simplified List Style */}
                {/* Timeline - Simplified List Style */}
                <div className="flex-1 overflow-y-auto py-6 flex flex-col gap-5 mt-2">
                    <h3 className="text-sm font-black text-slate-900 flex items-center justify-center gap-2 mb-2">
                        <Clock size={16} /> 최근 활동 기록
                    </h3>

                    {sortedRecords.length === 0 ? (
                        <div className="py-10 text-center text-slate-400 font-bold text-sm">
                            기록이 없습니다.
                        </div>
                    ) : (
                        <div className="w-full max-w-[260px] mx-auto flex flex-col gap-4">
                            {sortedRecords.map((record: any, i: number) => {
                                const type = getVal(record, ["type", "유형"]);
                                const time = new Date(getVal(record, ["timestamp", "시각"])).toLocaleString('ko-KR', {
                                    month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit'
                                });

                                return (
                                    <div key={i} className="flex items-start gap-3 w-full">
                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md min-w-[36px] text-center ${type === '등교' ? 'bg-emerald-50 text-emerald-600' :
                                                type === '하교' ? 'bg-blue-50 text-blue-600' :
                                                    type === '지각' ? 'bg-orange-50 text-orange-600' :
                                                        type === '결석' ? 'bg-rose-50 text-rose-600' :
                                                            type === '조퇴' ? 'bg-purple-50 text-purple-600' :
                                                                'bg-slate-100 text-slate-600'
                                                }`}>
                                                {type}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">{time}</span>
                                        </div>
                                        <div className="text-xs text-slate-700 font-bold leading-5 break-all pt-[1px]">
                                            {getVal(record, ["reason", "사유"]) || (type === "등교" ? "등교 확인" : type === "하교" ? "하교 확인" : "-")}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
