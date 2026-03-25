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
        <main className="min-h-screen bg-slate-50 px-6 py-16">
            <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <h1 className="text-2xl font-semibold text-slate-900">
                    SaaS Billing Orchestrator
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                    Sign in to the demo admin dashboard.
                </p>

                <div className="mt-8">
                    <LoginForm />
                </div>
            </div>
        </main>
    );
}