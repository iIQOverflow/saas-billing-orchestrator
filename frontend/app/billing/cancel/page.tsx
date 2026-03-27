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
        <main className="min-h-screen bg-[linear-gradient(to_bottom,_#f8fafc,_#f1f5f9)] px-6 py-16 sm:px-8 sm:py-24">
            <div className="mx-auto flex max-w-2xl items-center justify-center">
                <section className="w-full overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm">
                    <div className="bg-[radial-gradient(circle_at_top_left,_rgba(148,163,184,0.16),_transparent_38%),linear-gradient(to_bottom,_#ffffff,_#f8fafc)] px-6 py-8 sm:px-8 sm:py-9">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-700">
                            Billing update
                        </p>
                        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                            Checkout not completed
                        </h1>
                        <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
                            No new billing change was applied. Return to the dashboard and try
                            again later.
                        </p>
                    </div>

                    <div className="px-6 py-7 sm:px-8 sm:py-8">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <button
                                type="button"
                                onClick={goToDashboardNow}
                                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                            >
                                Return to dashboard
                            </button>

                            <p className="text-sm text-slate-500">
                                Redirecting in {secondsRemaining} second
                                {secondsRemaining === 1 ? '' : 's'}...
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
