import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import LogoutButton from '@/components/dashboard/LogoutButton';
import { SESSION_COOKIE } from '@/lib/auth';

export default async function DashboardPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (!token) {
        redirect('/login');
    }

    return (
        <main className="min-h-screen bg-slate-50 px-6 py-10">
            <div className="mx-auto max-w-5xl">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-semibold text-slate-900">Dashboard</h1>
                        <p className="mt-2 text-sm text-slate-600">
                            Auth is working. This page is protected by the session cookie.
                        </p>
                    </div>

                    <LogoutButton />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">Auth slice complete</h2>
                        <p className="mt-2 text-sm text-slate-600">
                            You are signed in and the dashboard route is protected.
                        </p>
                    </section>

                    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">Next slice</h2>
                        <p className="mt-2 text-sm text-slate-600">
                            Next, you will call <code>/api/me</code> and <code>/api/dashboard/summary</code>
                            and replace this placeholder with real data.
                        </p>
                    </section>
                </div>
            </div>
        </main>
    );
}