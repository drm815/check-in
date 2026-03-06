"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  QrCode,
  MapPin,
  FileText,
  MessageCircle,
  Bell,
  Clock,
  CheckCircle2,
  Calendar,
  ChevronRight,
  Camera,
  User,
  Settings
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import Chatbot from "@/components/Chatbot";

export default function Home() {
  // sessionStorage에서 오늘 스캔 결과 즉시 읽어 초기값 설정
  const [status, setStatus] = useState<"away" | "school" | "home">(() => {
    if (typeof window === "undefined") return "away";
    const lastType = sessionStorage.getItem("last_attendance_type");
    const lastTime = sessionStorage.getItem("last_attendance_time");
    if (!lastType || !lastTime) return "away";
    const today = new Date().toISOString().split('T')[0];
    const isToday = new Date(lastTime).toISOString().split('T')[0] === today;
    if (!isToday) return "away";
    return lastType === "하교" ? "home" : "school";
  });
  const [scanTime, setScanTime] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const lastTime = sessionStorage.getItem("last_attendance_time");
    const lastType = sessionStorage.getItem("last_attendance_type");
    if (!lastTime || !lastType) return null;
    const today = new Date().toISOString().split('T')[0];
    if (new Date(lastTime).toISOString().split('T')[0] !== today) return null;
    return new Date(lastTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [chatbotEnabled, setChatbotEnabled] = useState(false);
  const [studentName, setStudentName] = useState(() =>
    typeof window !== "undefined" ? sessionStorage.getItem("student_name") || "" : ""
  );
  const [announcements, setAnnouncements] = useState<any[]>([]);

  const router = useRouter();

  useEffect(() => {
    fetch('/api/admin/settings?key=chatbotEnabled')
      .then(r => r.json())
      .then(d => {
        // null = 설정한 적 없음 → 기본값 true, 'false' = 관리자가 꺼놓음
        setChatbotEnabled(d.value !== 'false');
      })
      .catch(() => { setChatbotEnabled(true); });
  }, []);

  useEffect(() => {
    const studentId = sessionStorage.getItem("student_id");
    if (!studentId) {
      router.push("/login");
      return;
    }

    // Fetch Status and Announcements
    const fetchData = async () => {
      try {
        const [annRes, attRes] = await Promise.all([
          fetch("/api/announcements"),
          fetch(`/api/admin/attendance?v=${Date.now()}`)
        ]);

        if (annRes.ok) {
          const data = await annRes.json();
          setAnnouncements(data);
        }

        if (attRes.ok) {
          const allAtt = await attRes.json();
          const studentId = sessionStorage.getItem("student_id");
          const today = new Date().toISOString().split('T')[0];

          // 1. Get ALL records for this student
          const myAllRecords = allAtt.filter((r: any) => {
            const rId = (r.studentid || r["학번"] || "").toString().trim();
            return rId === studentId;
          });

          // Sort by timestamp desc (newest first)
          myAllRecords.sort((a: any, b: any) =>
            new Date(b.timestamp || b["시각"]).getTime() - new Date(a.timestamp || a["시각"]).getTime()
          );

          // 2. Main Status Logic (Only considers TODAY's check-in/out)
          const todayRecords = myAllRecords.filter((r: any) => {
            const rDate = new Date(r.timestamp || r["시각"]).toISOString().split('T')[0];
            const type = (r.type || r["유형"] || "").toString().trim();
            return rDate === today && (type === "등교" || type === "하교");
          });

          // sessionStorage에 최근 스캔 결과가 있으면 GAS보다 우선 적용
          // (GAS 캐싱으로 인해 방금 찍은 출결이 아직 반영 안 된 경우 대비)
          const lastType = sessionStorage.getItem("last_attendance_type");
          const lastTime = sessionStorage.getItem("last_attendance_time");
          const lastTimeDate = lastTime ? new Date(lastTime).toISOString().split('T')[0] : null;
          const isLastTimeToday = lastTimeDate === today;

          if (todayRecords.length > 0) {
            const latest = todayRecords[0];
            const gasType = (latest.type || latest["유형"] || "").toString().trim();
            const gasTime = new Date(latest.timestamp || latest["시각"]);

            // sessionStorage 값이 오늘 것이고 GAS 최신 기록보다 더 최근이면 우선 사용
            let finalType = gasType;
            let finalTime = gasTime;
            if (isLastTimeToday && lastType && lastTime) {
              const lastTimestamp = new Date(lastTime);
              if (lastTimestamp > gasTime) {
                finalType = lastType;
                finalTime = lastTimestamp;
              }
            }

            if (finalType === "하교") {
              setStatus("home");
            } else if (finalType === "등교") {
              setStatus("school");
            } else {
              setStatus("away");
            }

            setScanTime(finalTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }));
          } else if (isLastTimeToday && lastType) {
            // GAS에 아직 없지만 오늘 스캔한 기록이 sessionStorage에 있음
            setStatus(lastType === "하교" ? "home" : "school");
            setScanTime(new Date(lastTime!).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }));
          } else {
            setStatus("away");
            setScanTime(null);
          }


        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();

    // 스캔 페이지에서 돌아올 때 상태 갱신 (Next.js 클라이언트 라우팅은 리마운트 안 함)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchData();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [router]);

  const timeString = currentTime.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const dateString = currentTime.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center pt-[10px] overflow-y-auto">
      <main className="w-[90%] max-w-[400px] flex flex-col pb-12 gap-[30px]">
        {/* Top Spacer */}
        <div className="h-[5px] shrink-0" />

        {/* Header */}
        <div className="flex justify-between items-start animate-fade px-2">
          <div className="flex flex-col gap-2">
            <h2 className="text-gray-400 text-[11px] font-black uppercase tracking-[0.3em]">{dateString}</h2>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-gray-900 leading-tight">
                {studentName ? `${studentName}님,` : "안녕하세요!"} <br />
                오늘도 좋은 하루 되세요! ☀️
              </h1>
            </div>
          </div>
          <LogoutButton className="bg-white rounded-full shadow-sm border border-slate-100 mt-2" />
        </div>

        {/* Status Card Section */}
        <div className="w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`relative overflow-hidden rounded-[2rem] p-6 shadow-lg border-2 transition-all duration-300 flex items-center justify-between pl-14 pr-8 ${status === "school" ? "bg-[#FFF1F2] border-[#FFE4E6] text-[#9F1239]" :
              status === "home" ? "bg-emerald-50 border-emerald-100 text-emerald-700" :
                "bg-[#F0F9FF] border-[#E0F2FE] text-[#075985]"
              }`}
          >
            <div className="flex items-center gap-5">
              <div className={`p-4 rounded-xl shadow-sm shrink-0 ${status === "school" ? "bg-white text-rose-500" :
                status === "home" ? "bg-white text-emerald-500" :
                  "bg-white text-sky-500"
                }`}>
                {status === "school" ? <CheckCircle2 size={26} strokeWidth={2.5} /> :
                  status === "home" ? <MapPin size={26} strokeWidth={2.5} /> :
                    <Clock size={26} strokeWidth={2.5} />}
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 leading-none mb-1">
                  {status === "school" ? "In School" : status === "home" ? "Returned Home" : "Away"}
                </span>
                <h3 className="text-xl font-black tracking-tight leading-tight">
                  {status === "school" ? "등교 완료" : status === "home" ? "하교 완료" : "미등교 상태"}
                </h3>
                {scanTime && (
                  <div className="mt-1 flex items-center gap-1.5 opacity-50">
                    <span className="text-[9px] font-bold uppercase tracking-widest">{scanTime} 스캔됨</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Action Grid Section */}
        <div className="w-full">
          <div className="grid grid-cols-2 gap-4">
            <Link href="/scan" className="contents">
              <ActionButton
                icon={<QrCode size={30} />}
                label="출결 스캔"
                sub="체크하기"
                color="bg-blue-50 text-blue-600"
              />
            </Link>
            <Link href="/upload" className="contents">
              <ActionButton
                icon={<Camera size={30} />}
                label="활동 기록"
                sub="사진 제출"
                color="bg-purple-50 text-purple-600"
              />
            </Link>
            <Link href="/report" className="contents">
              <ActionButton
                icon={<MessageCircle size={30} />}
                label="출결 신고"
                sub="사유 적기"
                color="bg-orange-50 text-orange-600"
              />
            </Link>
            <Link href="/settings/password" className="contents">
              <ActionButton
                icon={<Settings size={30} />}
                label="비번 변경"
                sub="보안 설정"
                color="bg-emerald-50 text-emerald-600"
              />
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-6 mt-4 pb-12 w-full">
          <h3 className="text-2xl font-black flex items-center justify-between px-2">
            중요 공지 및 일정
          </h3>
          <div className="flex flex-col gap-6">
            {announcements.length === 0 ? (
              <div className="premium-card p-12 flex flex-col items-center gap-4 text-center bg-gray-50/50 border-dashed border-2 rounded-[3rem]">
                <Bell className="text-gray-300" size={48} />
                <p className="text-lg text-gray-400 font-medium">현재 등록된 주요 일정이 없습니다.</p>
              </div>
            ) : (
              announcements.map((ann, i) => (
                <motion.div
                  key={ann.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="premium-card p-8 flex flex-col gap-4 hover:border-indigo-100 transition-all cursor-pointer group rounded-[2.5rem] shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-3 py-1 rounded-full font-black ${ann.category === '일정' ? 'bg-blue-50 text-blue-600' :
                        ann.category === '행사' ? 'bg-purple-50 text-purple-600' : 'bg-gray-100 text-gray-600'
                        }`}>
                        {ann.category}
                      </span>
                      <h5 className="font-black text-xl text-gray-800 group-hover:text-indigo-600 transition-colors line-clamp-1 tracking-tight">{ann.title}</h5>
                    </div>
                    <span className="text-xs font-bold text-gray-400">{ann.date ? new Date(ann.date).toLocaleDateString() : ""}</span>
                  </div>
                  <p className="text-base text-gray-500 line-clamp-2 leading-relaxed font-medium opacity-80">{ann.content}</p>
                </motion.div>
              ))
            )}
          </div>
        </div>


        {chatbotEnabled && <Chatbot />}
      </main>
    </div>
  );
}

function ActionButton({ icon, label, sub, color, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="premium-card p-6 flex flex-col gap-4 items-start text-left border-none shadow-md hover:shadow-lg h-full w-full transition-all hover:-translate-y-1"
    >
      <div className={`p-4 rounded-2xl shrink-0 ${color} shadow-sm`}>
        {icon}
      </div>
      <div className="flex flex-col gap-1">
        <h4 className="font-black text-gray-800 text-xl tracking-tight leading-none break-keep">{label}</h4>
        <p className="text-[11px] text-gray-400 leading-tight opacity-80 font-semibold">{sub}</p>
      </div>
    </button>
  );
}

function ActivityItem({ title, time, icon, type }: any) {
  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-50">
      <div className={`p-2 rounded-xl ${type === 'checkin' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
        {icon}
      </div>
      <div className="flex-1">
        <h5 className="font-semibold text-gray-800 leading-tight">{title}</h5>
        <p className="text-xs text-gray-500">{time}</p>
      </div>
      <ChevronRight size={16} className="text-gray-300" />
    </div>
  );
}
