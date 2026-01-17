"use client";

import { useState } from "react";
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
    Settings
} from "lucide-react";
import { motion } from "framer-motion";

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState("attendance");

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
            <div className="p-6 grid grid-cols-3 gap-4">
                <SummaryCard label="총 인원" value="28명" icon={<Users className="text-blue-500" />} />
                <SummaryCard label="등교 완료" value="24명" icon={<CheckCircle2 className="text-green-500" />} />
                <SummaryCard label="미확인" value="4명" icon={<AlertCircle className="text-orange-500" />} />
            </div>

            {/* Tabs */}
            <div className="px-6 flex gap-6 border-b border-gray-200 bg-white">
                <TabButton active={activeTab === 'attendance'} onClick={() => setActiveTab('attendance')} label="출결 현황" />
                <TabButton active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} label="결석 신고" />
                <TabButton active={activeTab === 'surveys'} onClick={() => setActiveTab('surveys')} label="응답 내역" />
            </div>

            {/* Content Area */}
            <div className="p-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-bold text-gray-700 flex items-center gap-2">
                            <FileSpreadsheet size={16} className="text-emerald-600" />
                            자동 정렬된 데이터
                        </h3>
                        <button className="text-xs font-semibold text-indigo-600 flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-indigo-100 shadow-sm">
                            <Download size={14} /> Google Sheets 열기
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500 uppercase text-[10px] tracking-wider font-bold">
                                    <th className="px-6 py-4">번 호</th>
                                    <th className="px-6 py-4">이 름</th>
                                    <th className="px-6 py-4">상 태</th>
                                    <th className="px-6 py-4">확 인</th>
                                    <th className="px-6 py-4">등교 시각</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                <TableRow id="1" name="강한별" status="등교" time="08:15" verified />
                                <TableRow id="2" name="김민재" status="등교" time="08:22" verified />
                                <TableRow id="3" name="박서연" status="지각" time="08:55" verified color="text-orange-600" />
                                <TableRow id="4" name="송지효" status="미등교" time="-" verified={false} color="text-red-500" />
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Float Button for Manual QR */}
            <button className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 transition-transform">
                <ExternalLink size={24} />
            </button>
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

function TableRow({ id, name, status, time, verified, color = "text-gray-800" }: any) {
    return (
        <tr className="hover:bg-gray-50/50 transition-colors">
            <td className="px-6 py-4 text-gray-400 font-mono">{id}</td>
            <td className="px-6 py-4 font-bold text-gray-800">{name}</td>
            <td className={`px-6 py-4 font-semibold ${color}`}>{status}</td>
            <td className="px-6 py-4">
                {verified ? (
                    <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-md text-[10px] font-bold">
                        <CheckCircle2 size={12} /> 확인됨
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-1 rounded-md text-[10px] font-bold">
                        <Clock size={12} /> 메일 발송됨
                    </span>
                )}
            </td>
            <td className="px-6 py-4 text-gray-500">{time}</td>
        </tr>
    );
}
