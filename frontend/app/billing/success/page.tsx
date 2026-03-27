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
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.1),_transparent_32%),linear-gradient(to_bottom,_#f6f8fb,_#eef6f1_46%,_#f7faf8)] px-6 py-16 sm:px-8 sm:py-24">
            <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-md items-center justify-center">
                <section className="w-full overflow-hidden rounded-[32px] border border-slate-200/80 bg-white/94 px-6 py-8 text-center shadow-[0_30px_80px_-48px_rgba(15,23,42,0.42)] backdrop-blur sm:px-8 sm:py-9">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 ring-1 ring-emerald-200/80">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    </div>
                    <p className="mt-5 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
                        Payment submitted
                    </p>
                    <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                        Billing change in progress
                    </h1>
                    <p className="mt-3 text-sm leading-6 text-slate-700">
                        Your payment was submitted. The billing change finalizes asynchronously in
                        the background, and the dashboard refreshes when you return.
                    </p>

                    <div className="mt-8 flex flex-col gap-3 border-t border-slate-200/90 pt-6">
                        <button
                            type="button"
                            onClick={goToDashboardNow}
                            className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white shadow-[0_20px_36px_-24px_rgba(15,23,42,0.9)] transition hover:-translate-y-0.5 hover:bg-slate-800"
                        >
                            Return to dashboard
                        </button>

                        <p className="text-sm text-slate-600">
                            Redirecting in {secondsRemaining} second
                            {secondsRemaining === 1 ? '' : 's'}...
                        </p>
                    </div>
                </section>
            </div>
        </main>
    );
}
