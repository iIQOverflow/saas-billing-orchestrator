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
        <main className="min-h-screen bg-[linear-gradient(to_bottom,_#f8fafc,_#f1f5f9)] px-6 py-16 sm:px-8 sm:py-24">
            <div className="mx-auto max-w-3xl">
                <section className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm">
                    <div className="bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.12),_transparent_38%),linear-gradient(to_bottom,_#ffffff,_#f8fafc)] px-6 py-8 sm:px-10 sm:py-10">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
                            Admin sign in
                        </p>
                        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-[2rem]">
                            SaaS Billing Orchestrator
                        </h1>
                        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                            Sign in to review billing state, quota, and plan changes.
                        </p>
                    </div>

                    <div className="px-6 py-8 sm:px-10 sm:py-10">
                        <div className="mx-auto max-w-md">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                Demo access
                            </p>
                            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                                Open the dashboard
                            </h2>

                            <div className="mt-6 rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200 sm:p-6">
                                <LoginForm />
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
