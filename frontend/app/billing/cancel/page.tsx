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
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.12),_transparent_30%),linear-gradient(to_bottom,_#f4f7fb,_#eef2f6_42%,_#f8fafc)] px-6 py-16 sm:px-8 sm:py-24">
            <div className="mx-auto flex max-w-md items-center justify-center">
                <section className="w-full rounded-[30px] border border-slate-200/80 bg-white/95 px-6 py-8 text-center shadow-[0_24px_70px_-46px_rgba(15,23,42,0.42)] sm:px-8 sm:py-10">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-700">
                        Billing update
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                        No billing change
                    </h1>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                        No new billing change was applied. Your current plan remains in place when
                        you return to the dashboard.
                    </p>

                    <div className="mt-8 flex flex-col gap-3">
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
                </section>
            </div>
        </main>
    );
}
