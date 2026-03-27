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
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.08),_transparent_28%),linear-gradient(to_bottom,_#f4f7fb,_#eef3f8_42%,_#f8fafc)] px-6 py-16 sm:px-8 sm:py-24">
            <div className="mx-auto flex max-w-4xl items-center justify-center">
                <section className="w-full rounded-[32px] border border-slate-200/80 bg-white/95 px-6 py-8 shadow-[0_24px_70px_-46px_rgba(15,23,42,0.42)] sm:px-8 sm:py-10">
                    <div className="mx-auto max-w-md text-center">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
                            Admin sign in
                        </p>
                        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-[2.25rem]">
                            SaaS Billing Orchestrator
                        </h1>
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                            Access the billing workspace for plan changes and quota oversight.
                        </p>
                    </div>

                    <div className="mx-auto mt-8 max-w-md rounded-[28px] border border-slate-200/80 bg-slate-50/80 p-6 shadow-sm sm:p-7">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                    Demo access
                                </p>
                                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                                    Open dashboard
                                </h2>
                            </div>

                            <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
                                Prefilled
                            </span>
                        </div>

                        <p className="mt-3 text-sm text-slate-600">
                            Sign in with the prepared interview credentials.
                        </p>

                        <div className="mt-6">
                            <LoginForm />
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
