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
        <div className="space-y-3">
            <button
                type="button"
                onClick={handleConsume}
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white shadow-[0_20px_36px_-24px_rgba(15,23,42,0.9)] transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
            >
                {isSubmitting ? 'Updating...' : 'Use 1 unit'}
            </button>

            <p className="text-sm leading-6 text-slate-500">Demo a one-unit usage update.</p>

            {error ? (
                <p className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    {error}
                </p>
            ) : null}
        </div>
    );
}
