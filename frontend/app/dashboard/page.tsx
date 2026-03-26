import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import LogoutButton from '@/components/dashboard/LogoutButton';
import { SESSION_COOKIE } from '@/lib/auth';

type MeResponse = {
    email: string;
    companyName: string;
};

export default async function DashboardPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (!token) {
        redirect('/login');
    }

    const headerStore = await headers();
    const host = headerStore.get('host');

    if (!host) {
        throw new Error('Could not determine the current host.');
    }

    const protocol =
        headerStore.get('x-forwarded-proto') ??
        (process.env.NODE_ENV === 'production' ? 'https' : 'http');

    let meData: MeResponse | null = null;
    let meError = '';
    let meStatus: number | null = null;

    try {
        const meResponse = await fetch(`${protocol}://${host}/api/me`, {
            method: 'GET',
            headers: {
                cookie: headerStore.get('cookie') ?? '',
            },
            cache: 'no-store',
        });

        meStatus = meResponse.status;

        if (meStatus === 401) {
            redirect('/login');
        }

        if (!meResponse.ok) {
            const rawText = await meResponse.text();
            meError = rawText || `Request failed with status ${meStatus}`;
        } else {
            meData = (await meResponse.json()) as MeResponse;
        }
    } catch {
        meError = 'Could not load current user data.';
    }

    return (
        <main className="min-h-screen bg-slate-50 px-6 py-10">
            <div className="mx-auto max-w-5xl">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-semibold text-slate-900">Dashboard</h1>
                        <p className="mt-2 text-sm text-slate-600">
                            This dashboard currently loads only <code>/api/me</code>.
                        </p>
                    </div>

                    <LogoutButton />
                </div>

                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">Current user</h2>

                    {meError ? (
                        <p className="mt-3 text-sm text-red-600">{meError}</p>
                    ) : meData ? (
                        <div className="mt-4 space-y-3">
                            <div>
                                <p className="text-sm text-slate-500">Email</p>
                                <p className="text-base font-medium text-slate-900">{meData.email}</p>
                            </div>

                            <div>
                                <p className="text-sm text-slate-500">Company</p>
                                <p className="text-base font-medium text-slate-900">
                                    {meData.companyName}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <p className="mt-3 text-sm text-slate-600">No user data available.</p>
                    )}
                </section>
            </div>
        </main>
    );
}