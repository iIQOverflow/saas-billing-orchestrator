'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginForm() {
    const router = useRouter();

    const [email, setEmail] = useState('admin@acme.com');
    const [password, setPassword] = useState('P@ssw0rd!');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function submitLogin() {
        setError('');
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = (await response.json().catch(() => ({}))) as {
                message?: string;
                success?: boolean;
            };

            if (!response.ok) {
                setError(data.message ?? 'Login failed.');
                return;
            }

            router.push('/dashboard');
            router.refresh();
        } catch {
            setError('Network error. Make sure the frontend and backend are both running.');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <form
            onSubmit={async (event) => {
                event.preventDefault();
                await submitLogin();
            }}
            className="space-y-4"
        >
            <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
                    Email
                </label>
                <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-0 focus:border-slate-500"
                />
            </div>

            <div>
                <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
                    Password
                </label>
                <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-0 focus:border-slate-500"
                />
            </div>

            {error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                </div>
            ) : null}

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-slate-900 px-4 py-2 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
        </form>
    );
}