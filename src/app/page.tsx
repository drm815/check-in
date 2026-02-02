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

export default function Home() {
  const [status, setStatus] = useState<"away" | "school" | "home">("away");
  const [scanTime, setScanTime] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [studentName, setStudentName] = useState("");
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const studentId = sessionStorage.getItem("student_id");
    if (!studentId) {
      router.push("/login");
      return;
    }

    const name = sessionStorage.getItem("student_name") || "";
    setStudentName(name);

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

          // Find today's records for this student and take the latest one
          const studentRecords = allAtt.filter((r: any) => {
            const rId = (r.studentid || r["학번"] || "").toString().trim();
            const rDate = new Date(r.timestamp || r["시각"]).toISOString().split('T')[0];
            return rId === studentId && rDate === today;
          });

          if (studentRecords.length > 0) {
            // Sort by timestamp desc to get the latest
            studentRecords.sort((a: any, b: any) =>
              new Date(b.timestamp || b["시각"]).getTime() - new Date(a.timestamp || a["시각"]).getTime()
            );

            const latest = studentRecords[0];
            const type = (latest.type || latest["유형"] || "").toString().trim();

            if (type === "하교") {
              setStatus("home");
            } else {
              setStatus("school");
            }

            const time = new Date(latest.timestamp || latest["시각"]).toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit'
            });
            setScanTime(time);
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

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
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
    <div className="min-h-screen bg-[#F8FAFC]">
      <main className="w-full max-w-[1200px] mx-auto flex flex-col px-10 py-16 gap-16 overflow-y-auto min-h-screen">
        {/* Header */}
        <div className="flex justify-between items-center animate-fade px-2">
          <div className="flex flex-col gap-2">
            <h2 className="text-gray-400 text-[11px] font-black uppercase tracking-[0.3em]">{dateString}</h2>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-black text-gray-900 leading-tight">
                {studentName ? `${studentName}님,` : "안녕하세요!"} <br />
                오늘도 기분 좋은 하루 되세요! ☀️
              </h1>
            </div>
          </div>
        </div>

        {/* Status Card Section */}
        <div className="w-full max-w-[700px] mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`relative overflow-hidden rounded-[4rem] p-12 shadow-xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-8 ${status === "school" ? "bg-[#FFF1F2] border-[#FFE4E6] text-[#9F1239]" :
              status === "home" ? "bg-emerald-50 border-emerald-100 text-emerald-700" :
                "bg-[#F0F9FF] border-[#E0F2FE] text-[#075985]"
              }`}
          >
            <div className="flex flex-col items-center gap-6">
              <div className={`p-4 rounded-2xl shadow-sm ${status === "school" ? "bg-white text-rose-500" :
                status === "home" ? "bg-white text-emerald-500" :
                  "bg-white text-sky-500"
                }`}>
                {status === "school" ? <CheckCircle2 size={32} strokeWidth={2.5} /> :
                  status === "home" ? <MapPin size={32} strokeWidth={2.5} /> :
                    <Clock size={32} strokeWidth={2.5} />}
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-base font-black uppercase tracking-[0.3em] opacity-60">
                  {status === "school" ? "In School" : status === "home" ? "Returned Home" : "Away"}
                </span>
                <h3 className="text-5xl font-black tracking-tight text-center leading-none">
                  {status === "school" ? "등교 완료" : status === "home" ? "하교 완료" : "미등교 상태"}
                </h3>
              </div>
            </div>

            {scanTime && (
              <div className="mt-4 pt-6 border-t border-current border-dashed opacity-30 w-full flex flex-col items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest">Last Scanned At</span>
                <span className="text-3xl font-black tracking-tighter">{scanTime}</span>
              </div>
            )}
          </motion.div>
        </div>

        {/* Action Grid */}
        {/* Action Grid Section */}
        <div className="w-full max-w-[800px] mx-auto">
          <div className="grid grid-cols-2 gap-8">
            <Link href="/scan" className="contents">
              <ActionButton
                icon={<QrCode size={40} />}
                label="출결 스캔"
                sub="QR/NFC 태그 체크"
                color="bg-blue-50 text-blue-600"
              />
            </Link>
            <Link href="/upload" className="contents">
              <ActionButton
                icon={<Camera size={40} />}
                label="활동 기록"
                sub="오늘의 사진 제출"
                color="bg-purple-50 text-purple-600"
              />
            </Link>
            <Link href="/report" className="contents">
              <ActionButton
                icon={<MessageCircle size={40} />}
                label="출결 신고"
                sub="지각/결석 사유"
                color="bg-orange-50 text-orange-600"
              />
            </Link>
            <Link href="/settings/password" className="contents">
              <ActionButton
                icon={<Settings size={40} />}
                label="비번 변경"
                sub="보안 계정 설정"
                color="bg-emerald-50 text-emerald-600"
              />
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-6 mt-8 pb-12 max-w-[800px] mx-auto w-full">
          <h3 className="text-2xl font-black flex items-center justify-between px-2">
            중요 공지 및 일정
            <span className="text-xs text-indigo-500 font-bold border-2 border-indigo-100 px-3 py-1 rounded-full bg-indigo-50/50">New Notifications</span>
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
                    <span className="text-xs font-bold text-gray-400">{ann.date}</span>
                  </div>
                  <p className="text-base text-gray-500 line-clamp-2 leading-relaxed font-medium opacity-80">{ann.content}</p>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Bottom Nav Placeholder */}
        <div className="mt-auto pt-6 flex justify-around border-t border-gray-100">
          <NavIcon icon={<Calendar size={20} />} active />
          <NavIcon icon={<Bell size={20} />} />
          <NavIcon icon={<User size={20} />} />
        </div>
      </main>
    </div>
  );
}

function ActionButton({ icon, label, sub, color, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="premium-card p-10 flex flex-col gap-5 items-start text-left border-none shadow-md hover:shadow-lg h-full w-full transition-all hover:-translate-y-1"
    >
      <div className={`p-5 rounded-[2rem] shrink-0 ${color} shadow-sm`}>
        {icon}
      </div>
      <div className="flex flex-col gap-2">
        <h4 className="font-black text-gray-800 text-3xl tracking-tight leading-none break-keep">{label}</h4>
        <p className="text-sm text-gray-400 leading-tight opacity-80 font-semibold">{sub}</p>
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

function NavIcon({ icon, active = false }: any) {
  return (
    <button className={`p-2 rounded-xl transition-colors ${active ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400'}`}>
      {icon}
    </button>
  );
}
