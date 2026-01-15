import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_please_change';
const secret = new TextEncoder().encode(JWT_SECRET);

export async function hashPassword(password) {
    return await bcrypt.hash(password, 12);
}

export async function comparePassword(plain, hashed) {
    return await bcrypt.compare(plain, hashed);
}

export async function signJWT(payload) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(secret);
}

export async function verifyJWT(token) {
    try {
        const { payload } = await jwtVerify(token, secret);
        return payload;
    } catch (error) {
        return null;
    }
}
