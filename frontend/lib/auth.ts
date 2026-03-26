export const SESSION_COOKIE = 'sbo_session';

export function isProduction() {
    return process.env.NODE_ENV === 'production';
}

export function extractToken(payload: Record<string, unknown>): string | null {
    if (typeof payload.accessToken === 'string' && payload.accessToken.trim().length > 0) {
        return payload.accessToken;
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