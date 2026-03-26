'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

function extractErrorMessage(rawText: string): string {
    if (!rawText) {
        return 'Could not consume usage.';
    }

    try {
        const payload = JSON.parse(rawText) as Record<string, unknown>;

        if (typeof payload.message === 'string' && payload.message.trim().length > 0) {
            return payload.message;
        }

        if (typeof payload.error === 'string' && payload.error.trim().length > 0) {
            return payload.error;
        }
    } catch {
        // Fall through to raw text
    }

    return rawText;
}

export default function ConsumeUsageButton() {
    const router = useRouter();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    async function handleConsume() {
        setError('');
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/demo/usage/consume', {
                method: 'POST',
            });

            if (response.status === 401) {
                router.push('/login');
                router.refresh();
                return;
            }

            const rawText = await response.text();

            if (!response.ok) {
                setError(extractErrorMessage(rawText));
                return;
            }

            router.refresh();
        } catch {
            setError('Could not reach the frontend consume route.');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="mt-4">
            <button
                type="button"
                onClick={handleConsume}
                disabled={isSubmitting}
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {isSubmitting ? 'Updating...' : 'Use 1 unit'}
            </button>

            <p className="mt-2 text-sm text-slate-500">Demo a one-unit usage update.</p>

            {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        </div>
    );
}
