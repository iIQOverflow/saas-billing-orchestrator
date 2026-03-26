'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function BillingSuccessPage() {
    const router = useRouter();
    const [secondsRemaining, setSecondsRemaining] = useState(3);

    useEffect(() => {
        const countdownId = window.setInterval(() => {
            setSecondsRemaining((current) => (current > 0 ? current - 1 : 0));
        }, 1000);

        const redirectId = window.setTimeout(() => {
            router.replace('/dashboard');
            router.refresh();
        }, 3000);

        return () => {
            window.clearInterval(countdownId);
            window.clearTimeout(redirectId);
        };
    }, [router]);

    function goToDashboardNow() {
        router.replace('/dashboard');
        router.refresh();
    }

    return (
        <main className="min-h-screen bg-slate-50 px-6 py-16">
            <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <h1 className="text-2xl font-semibold text-slate-900">
                    Payment submitted
                </h1>

                <p className="mt-3 text-sm text-slate-700">
                    Stripe Checkout completed and your payment was submitted successfully.
                </p>

                <p className="mt-3 text-sm text-slate-700">
                    Your subscription upgrade is finalized asynchronously by the backend webhook.
                    When you return to the dashboard, the app will fetch the latest
                    <code className="mx-1 rounded bg-slate-100 px-1 py-0.5 text-xs">
                        /api/dashboard/summary
                    </code>
                    data again.
                </p>

                <p className="mt-3 text-sm text-slate-600">
                    If the plan does not look updated immediately, wait a few seconds and refresh
                    the dashboard once more.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <button
                        type="button"
                        onClick={goToDashboardNow}
                        className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white transition hover:bg-slate-800"
                    >
                        Go to dashboard now
                    </button>

                    <p className="text-sm text-slate-500">
                        Redirecting automatically in {secondsRemaining} second
                        {secondsRemaining === 1 ? '' : 's'}...
                    </p>
                </div>
            </div>
        </main>
    );
}