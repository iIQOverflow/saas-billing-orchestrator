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
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),_transparent_32%),linear-gradient(to_bottom,_#f6f8fb,_#eef3f8_46%,_#f7f9fc)] px-6 py-16 sm:px-8 sm:py-24">
            <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-5xl items-center justify-center">
                <section className="login-shell w-full max-w-[540px] overflow-hidden rounded-[34px] border border-slate-200/80 bg-white/92 px-6 py-8 shadow-[0_34px_90px_-52px_rgba(15,23,42,0.42)] backdrop-blur sm:px-8 sm:py-9">
                    <div className="rounded-[26px] border border-slate-200/90 bg-[linear-gradient(135deg,_rgba(248,250,252,0.92),_rgba(241,245,249,0.86))] px-5 py-5 sm:px-6">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
                            Interview demo
                        </p>
                        <h1 className="mt-3 max-w-[17ch] text-3xl font-semibold tracking-tight leading-[1.08] text-slate-950 sm:text-[2rem] sm:leading-[1.05]">
                            Sign in to the billing dashboard
                        </h1>
                        <p className="mt-3 text-sm leading-6 text-slate-700">
                            Use the prepared admin credentials to review plan and quota state.
                        </p>
                    </div>

                    <div className="mt-8 border-t border-slate-200/90 pt-6">
                        <div className="mb-5 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                                    Demo access
                                </p>
                                <p className="mt-1 text-sm text-slate-700">
                                    Prefilled credentials are ready.
                                </p>
                            </div>

                            <span className="inline-flex rounded-full border border-slate-300/70 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">
                                Ready
                            </span>
                        </div>

                        <LoginForm />
                    </div>
                </section>
            </div>
        </main>
    );
}
