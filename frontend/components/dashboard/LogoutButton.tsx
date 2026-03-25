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
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
            {isLoggingOut ? 'Signing out...' : 'Sign out'}
        </button>
    );
}