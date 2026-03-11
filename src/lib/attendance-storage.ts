// 출결 상태 localStorage 래퍼
// - 버전 키로 스키마 변경 시 이전 데이터 자동 무효화
// - try-catch로 Safari 프라이빗 모드 등 예외 처리

const V = 'v1';
const KEYS = {
    type: `attendance_type:${V}`,
    time: `attendance_time:${V}`,
} as const;

/** 로컬 시간 기준 YYYY-MM-DD 반환 (toISOString은 UTC라 한국에서 오전 9시 전까지 날짜 오차 발생) */
export function toLocalDateString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

export const attendanceStorage = {
    getType(): string | null {
        try { return localStorage.getItem(KEYS.type); } catch { return null; }
    },
    getTime(): string | null {
        try { return localStorage.getItem(KEYS.time); } catch { return null; }
    },
    set(type: string, time: string): void {
        try {
            localStorage.setItem(KEYS.type, type);
            localStorage.setItem(KEYS.time, time);
        } catch { /* 프라이빗 모드 등 */ }
    },
    clear(): void {
        try {
            localStorage.removeItem(KEYS.type);
            localStorage.removeItem(KEYS.time);
        } catch { /* 무시 */ }
    },
};
