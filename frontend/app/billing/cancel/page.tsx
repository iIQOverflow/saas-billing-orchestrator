'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function BillingCancelPage() {
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
                    Checkout canceled
                </h1>

                <p className="mt-3 text-sm text-slate-700">
                    You left Stripe Checkout before completing the upgrade.
                </p>

                <p className="mt-3 text-sm text-slate-700">
                    No immediate billing change was completed in this flow. You can return to the
                    dashboard and try again whenever you want.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <button
                        type="button"
                        onClick={goToDashboardNow}
                        className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white transition hover:bg-slate-800"
                    >
                        Back to dashboard
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