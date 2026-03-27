import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import LoginForm from '@/components/auth/LoginForm';
import { SESSION_COOKIE } from '@/lib/auth';

export default async function LoginPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (token) {
        redirect('/dashboard');
    }

    return (
        <main className="min-h-screen bg-slate-100 px-6 py-16 sm:py-20">
            <div className="mx-auto flex max-w-5xl items-center justify-center">
                <section className="w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.14),_transparent_42%),linear-gradient(to_bottom,_#ffffff,_#f8fafc)] px-6 py-8 sm:px-8">
                        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-700">
                            Admin access
                        </p>
                        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                            SaaS Billing Orchestrator
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                            Sign in to the demo admin workspace to walk through a thin,
                            backend-driven billing experience for tenants, subscriptions, and
                            quota usage.
                        </p>
                    </div>

                    <div className="grid gap-6 px-6 py-8 sm:px-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
                        <div className="space-y-6">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                <p className="text-sm font-medium text-slate-950">
                                    What this dashboard is for
                                </p>
                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                    This MVP is designed to show the admin side of the product:
                                    who is signed in, which plan is active, and how billing and
                                    usage data flow back from the backend.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                <p className="text-sm font-medium text-slate-950">
                                    What you can demo after sign-in
                                </p>
                                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                                    <li>
                                        Review the current workspace, active user, subscription
                                        status, and quota summary.
                                    </li>
                                    <li>
                                        Walk through upgrade and checkout flows without changing
                                        the thin frontend structure.
                                    </li>
                                    <li>
                                        Show how refreshed dashboard data reflects the latest API
                                        state after backend billing events complete.
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                            <div className="mb-6">
                                <h2 className="text-lg font-semibold text-slate-950">Sign in</h2>
                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                    Use the admin entry point below to open the demo dashboard and
                                    continue the interview walkthrough.
                                </p>
                            </div>

                            <LoginForm />
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
