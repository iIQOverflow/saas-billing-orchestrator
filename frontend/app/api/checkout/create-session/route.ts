import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { isProduction, SESSION_COOKIE } from '@/lib/auth';

function clearSessionCookie(response: NextResponse) {
    response.cookies.set({
        name: SESSION_COOKIE,
        value: '',
        httpOnly: true,
        sameSite: 'lax',
        secure: isProduction(),
        path: '/',
        maxAge: 0,
    });

    return response;
}

type CreateCheckoutSessionRequest = {
    planCode?: unknown;
    successUrl?: unknown;
    cancelUrl?: unknown;
};

export async function POST(request: Request) {
    const backendBaseUrl = process.env.BACKEND_BASE_URL;

    if (!backendBaseUrl) {
        return NextResponse.json(
            { message: 'BACKEND_BASE_URL is not configured.' },
            { status: 500 }
        );
    }

    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (!token) {
        return clearSessionCookie(
            NextResponse.json({ message: 'Not authenticated.' }, { status: 401 })
        );
    }

    let body: CreateCheckoutSessionRequest;

    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            { message: 'Request body must be valid JSON.' },
            { status: 400 }
        );
    }

    const planCode = typeof body.planCode === 'string' ? body.planCode.trim() : '';
    const successUrl =
        typeof body.successUrl === 'string' ? body.successUrl.trim() : '';
    const cancelUrl =
        typeof body.cancelUrl === 'string' ? body.cancelUrl.trim() : '';

    if (!planCode || !successUrl || !cancelUrl) {
        return NextResponse.json(
            { message: 'planCode, successUrl, and cancelUrl are required.' },
            { status: 400 }
        );
    }

    let backendResponse: Response;

    try {
        backendResponse = await fetch(`${backendBaseUrl}/api/checkout/create-session`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                planCode,
                successUrl,
                cancelUrl,
            }),
        });
    } catch {
        return NextResponse.json(
            { message: 'Could not reach the backend /api/checkout/create-session endpoint.' },
            { status: 502 }
        );
    }

    if (backendResponse.status === 401) {
        return clearSessionCookie(
            new NextResponse(null, {
                status: 401,
            })
        );
    }

    const rawText = await backendResponse.text();
    const contentType = backendResponse.headers.get('content-type') ?? '';

    if (contentType.includes('application/json')) {
        try {
            return NextResponse.json(JSON.parse(rawText), {
                status: backendResponse.status,
            });
        } catch {
            return new NextResponse(rawText, {
                status: backendResponse.status,
                headers: {
                    'content-type': contentType,
                },
            });
        }
    }

    return new NextResponse(rawText, {
        status: backendResponse.status,
        headers: contentType
            ? {
                'content-type': contentType,
            }
            : undefined,
    });
}