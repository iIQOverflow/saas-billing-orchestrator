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

export async function GET() {
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

    let backendResponse: Response;

    try {
        backendResponse = await fetch(`${backendBaseUrl}/api/dashboard/summary`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            cache: 'no-store',
        });
    } catch {
        return NextResponse.json(
            { message: 'Could not reach the backend /api/dashboard/summary endpoint.' },
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