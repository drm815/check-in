// 출결 상태 localStorage 래퍼
// - 버전 키로 스키마 변경 시 이전 데이터 자동 무효화
// - try-catch로 Safari 프라이빗 모드 등 예외 처리

const V = 'v1';
const KEYS = {
    type: `attendance_type:${V}`,
    time: `attendance_time:${V}`,
} as const;

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
