import { jwtVerify, SignJWT } from "jose";

export const getJwtSecretKey = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length === 0) {
        throw new Error("환경변수 JWT_SECRET이 설정되지 않았습니다.");
    }
    return secret;
};

export const verifyAuth = async (token: string) => {
    try {
        const verified = await jwtVerify(token, new TextEncoder().encode(getJwtSecretKey()));
        const payload = verified.payload as { role?: string };
        if (payload.role !== 'admin') {
            throw new Error("Invalid role.");
        }
        return payload as { role: 'admin' };
    } catch {
        throw new Error("Your token has expired.");
    }
};

export const signAuth = async (payload: { role: string }) => {
    const secret = new TextEncoder().encode(getJwtSecretKey());
    const alg = 'HS256';
    const jwt = await new SignJWT(payload)
        .setProtectedHeader({ alg })
        .setIssuedAt()
        .setExpirationTime('2h') // 2시간 유효
        .sign(secret);
    return jwt;
};
