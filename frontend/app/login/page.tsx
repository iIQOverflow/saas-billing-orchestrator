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
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.1),_transparent_30%),linear-gradient(to_bottom,_#f8fafc,_#eef2ff_42%,_#f8fafc)] px-6 py-16 sm:px-8 sm:py-24">
            <div className="mx-auto max-w-5xl">
                <section className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-white/95 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.45)]">
                    <div className="grid lg:grid-cols-[minmax(0,1fr)_420px]">
                        <div className="bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.12),_transparent_40%),linear-gradient(to_bottom_right,_#ffffff,_#f8fafc)] px-8 py-10 sm:px-10 sm:py-12">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
                                Admin sign in
                            </p>
                            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-[2.2rem]">
                                SaaS Billing Orchestrator
                            </h1>
                            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
                                Access the billing workspace for quota, subscription, and plan
                                changes.
                            </p>

                            <div className="mt-8 grid gap-3 sm:grid-cols-2">
                                <div className="rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-4 shadow-sm">
                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                        Workspace
                                    </p>
                                    <p className="mt-2 text-base font-semibold text-slate-950">
                                        Billing overview
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-4 shadow-sm">
                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                        Access
                                    </p>
                                    <p className="mt-2 text-base font-semibold text-slate-950">
                                        Demo-ready sign in
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-slate-200/80 bg-slate-50/70 px-6 py-8 sm:px-8 sm:py-10 lg:border-l lg:border-t-0">
                            <div className="mx-auto max-w-sm rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-sm sm:p-7">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                    Demo access
                                </p>
                                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                                    Open dashboard
                                </h2>
                                <p className="mt-2 text-sm text-slate-600">
                                    Credentials are prefilled for the interview flow.
                                </p>

                                <div className="mt-6">
                                    <LoginForm />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
