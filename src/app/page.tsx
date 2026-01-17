"use client";

import { useState, useEffect } from "react";
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
  User
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function Home() {
  const [status, setStatus] = useState<"away" | "school">("away");
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
    <main className="flex-1 flex flex-col p-6 gap-6 overflow-y-auto bg-[#F8FAFC]">
      {/* Header */}
      <div className="flex justify-between items-center animate-fade">
        <div>
          <h2 className="text-gray-500 text-sm font-medium">{dateString}</h2>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            안녕하세요, <span className="gradient-text">홍길동</span> 학생! 👋
          </h1>
        </div>
        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
          <User size={24} />
        </div>
      </div>

      {/* Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="premium-card bg-indigo-600 text-white relative overflow-hidden"
      >
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-indigo-100 text-sm">현재 등교 상태</p>
              <h3 className="text-3xl font-bold mt-1">
                {status === "school" ? "등교 완료" : "미등교"}
              </h3>
            </div>
            <div className={`p-3 rounded-2xl ${status === "school" ? "bg-green-400/20" : "bg-white/10"}`}>
              {status === "school" ? <CheckCircle2 size={32} /> : <Clock size={32} />}
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/10 w-fit px-3 py-1 rounded-full text-sm">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            현재 시각 {timeString}
          </div>
        </div>

        {/* Background blobs */}
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -left-10 -top-10 w-40 h-40 bg-indigo-400/20 rounded-full blur-3xl"></div>
      </motion.div>

      {/* Action Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/scan" className="contents">
          <ActionButton
            icon={<QrCode size={28} />}
            label="등하교 스캔"
            sub="QR / NFC"
            color="bg-blue-50 text-blue-600"
          />
        </Link>
        <ActionButton
          icon={<FileText size={28} />}
          label="체험학습 신청"
          sub="구글 드라이브 저장"
          color="bg-purple-50 text-purple-600"
          onClick={() => { }}
        />
        <Link href="/report" className="contents">
          <ActionButton
            icon={<MessageCircle size={28} />}
            label="지각/결석 신고"
            sub="학부모 자동 확인"
            color="bg-orange-50 text-orange-600"
          />
        </Link>
        <Link href="/admin" className="contents">
          <ActionButton
            icon={<Bell size={28} />}
            label="교사 대시보드"
            sub="데이터 관리"
            color="bg-emerald-50 text-emerald-600"
          />
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="flex flex-col gap-3 mt-4">
        <h3 className="text-lg font-bold">최근 활동</h3>
        <ActivityItem
          title="아침 등교 완료"
          time="오전 08:24"
          icon={<MapPin size={18} />}
          type="checkin"
        />
        <ActivityItem
          title="수학 여행 참가 신청"
          time="어제 오후 02:15"
          icon={<FileText size={18} />}
          type="survey"
        />
      </div>

      {/* Bottom Nav Placeholder */}
      <div className="mt-auto pt-6 flex justify-around border-t border-gray-100">
        <NavIcon icon={<Calendar size={20} />} active />
        <NavIcon icon={<Bell size={20} />} />
        <NavIcon icon={<User size={20} />} />
      </div>
    </main>
  );
}

function ActionButton({ icon, label, sub, color, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="premium-card p-5 flex flex-col gap-3 items-start text-left border-none shadow-sm hover:shadow-md"
    >
      <div className={`p-3 rounded-2xl ${color}`}>
        {icon}
      </div>
      <div>
        <h4 className="font-bold text-gray-800">{label}</h4>
        <p className="text-xs text-gray-500">{sub}</p>
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
