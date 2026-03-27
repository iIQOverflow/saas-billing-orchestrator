'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    async function handleLogout() {
        setIsLoggingOut(true);

        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
            });
        } finally {
            router.push('/login');
            router.refresh();
        }
    }

    return (
        <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-[0_12px_24px_-22px_rgba(15,23,42,0.75)] transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
            {isLoggingOut ? 'Signing out...' : 'Sign out'}
        </button>
    );
}
