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
        <main className="min-h-screen bg-slate-100 px-6 py-16 sm:px-8 sm:py-20">
            <div className="mx-auto flex max-w-6xl items-center justify-center">
                <section className="w-full overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                    <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
                        <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.14),_transparent_38%),linear-gradient(to_bottom,_#ffffff,_#f8fafc)] px-6 py-8 sm:px-8 sm:py-10 lg:border-b-0 lg:border-r">
                            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-700">
                                Admin entry point
                            </p>
                            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-[2rem]">
                                SaaS Billing Orchestrator
                            </h1>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                                Sign in to review the workspace, current subscription, quota
                                usage, and plan changes in the demo dashboard.
                            </p>

                            <div className="mt-8 grid gap-4 sm:grid-cols-2">
                                <div className="rounded-2xl border border-slate-200 bg-white/85 p-5">
                                    <p className="text-sm font-medium text-slate-950">
                                        What you can show
                                    </p>
                                    <p className="mt-2 text-sm leading-6 text-slate-600">
                                        Walk through a thin, backend-driven admin flow for
                                        subscription state, quota updates, and checkout handoff.
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-white/85 p-5">
                                    <p className="text-sm font-medium text-slate-950">
                                        Why this stays simple
                                    </p>
                                    <p className="mt-2 text-sm leading-6 text-slate-600">
                                        The frontend stays focused on presentation while the backend
                                        remains the source of truth for billing behavior.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white px-6 py-8 sm:px-8 sm:py-10">
                            <div className="mx-auto max-w-md">
                                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-7">
                                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                                        Sign in
                                    </p>
                                    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                                        Open the dashboard
                                    </h2>
                                    <p className="mt-2 text-sm leading-6 text-slate-600">
                                        Use the admin account below to continue the interview demo.
                                    </p>

                                    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
                                        <LoginForm />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
