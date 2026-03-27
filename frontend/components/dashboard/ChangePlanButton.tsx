'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type ChangePlanButtonProps = {
    planCode: string;
    displayName: string;
};

function extractMessageFromRawText(rawText: string): string {
    if (!rawText) {
        return 'Could not create checkout session.';
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
        // Fall through
    }

    return rawText;
}

export default function ChangePlanButton({
    planCode,
    displayName,
}: ChangePlanButtonProps) {
    const router = useRouter();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    async function handleUpgrade() {
        setError('');
        setIsSubmitting(true);

        try {
            const origin = window.location.origin;

            const response = await fetch('/api/checkout/create-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    planCode,
                    successUrl: `${origin}/billing/success`,
                    cancelUrl: `${origin}/billing/cancel`,
                }),
            });

            if (response.status === 401) {
                router.push('/login');
                router.refresh();
                return;
            }

            const rawText = await response.text();

            if (!response.ok) {
                setError(extractMessageFromRawText(rawText));
                return;
            }

            let payload: { checkoutUrl?: unknown } = {};

            try {
                payload = JSON.parse(rawText) as { checkoutUrl?: unknown };
            } catch {
                setError('Checkout response was not valid JSON.');
                return;
            }

            if (
                typeof payload.checkoutUrl !== 'string' ||
                payload.checkoutUrl.trim().length === 0
            ) {
                setError('Checkout URL was missing from the response.');
                return;
            }

            window.location.href = payload.checkoutUrl;
        } catch {
            setError('Could not reach the frontend checkout route.');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="space-y-2">
            <button
                type="button"
                onClick={handleUpgrade}
                disabled={isSubmitting}
                aria-label={`Change to ${displayName}`}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white shadow-[0_20px_36px_-24px_rgba(15,23,42,0.9)] transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
            >
                {isSubmitting ? 'Redirecting...' : `Change to ${displayName}`}
            </button>

            {error ? (
                <p className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    {error}
                </p>
            ) : null}
        </div>
    );
}
