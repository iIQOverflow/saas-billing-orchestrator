import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { extractMessage, extractToken, isProduction, SESSION_COOKIE } from '@/lib/auth';

type LoginRequestBody = {
    email?: unknown;
    password?: unknown;
};

export async function POST(request: Request) {
    const backendBaseUrl = process.env.BACKEND_BASE_URL;

    if (!backendBaseUrl) {
        return NextResponse.json(
            { message: 'BACKEND_BASE_URL is not configured.' },
            { status: 500 }
        );
    }

    let body: LoginRequestBody;

    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            { message: 'Request body must be valid JSON.' },
            { status: 400 }
        );
    }

    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !password) {
        return NextResponse.json(
            { message: 'Email and password are required.' },
            { status: 400 }
        );
    }

    let backendResponse: Response;

    try {
        backendResponse = await fetch(`${backendBaseUrl}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
            body: JSON.stringify({ email, password }),
        });
    } catch {
        return NextResponse.json(
            { message: 'Could not reach the backend login endpoint.' },
            { status: 502 }
        );
    }

    const rawText = await backendResponse.text();

    let payload: Record<string, unknown> = {};

    if (rawText) {
        try {
            payload = JSON.parse(rawText) as Record<string, unknown>;
        } catch {
            payload = { message: rawText };
        }
    }

    if (!backendResponse.ok) {
        return NextResponse.json(
            {
                message:
                    extractMessage(payload) ?? 'Login failed.',
            },
            { status: backendResponse.status }
        );
    }

    const token = extractToken(payload);

    if (!token) {
        return NextResponse.json(
            {
                message:
                    'Login succeeded, but no JWT token field was found. Check the backend login response shape.',
            },
            { status: 500 }
        );
    }

    const cookieStore = await cookies();

    cookieStore.set({
        name: SESSION_COOKIE,
        value: token,
        httpOnly: true,
        sameSite: 'lax',
        secure: isProduction(),
        path: '/',
        maxAge: 60 * 60,
    });

    return NextResponse.json({ success: true });
}