export const SESSION_COOKIE = 'sbo_session';

export function isProduction() {
    return process.env.NODE_ENV === 'production';
}

export function extractToken(payload: Record<string, unknown>): string | null {
    const candidates = [
        payload.token,
        payload.jwt,
        payload.accessToken,
        payload.access_token,
    ];

    for (const value of candidates) {
        if (typeof value === 'string' && value.trim().length > 0) {
            return value;
        }
    }

    return null;
}

export function extractMessage(payload: Record<string, unknown>): string | null {
    if (typeof payload.message === 'string' && payload.message.trim().length > 0) {
        return payload.message;
    }

    if (typeof payload.error === 'string' && payload.error.trim().length > 0) {
        return payload.error;
    }

    return null;
}