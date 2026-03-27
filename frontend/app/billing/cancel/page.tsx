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
        <main className="min-h-screen bg-slate-100 px-6 py-16 sm:px-8 sm:py-20">
            <div className="mx-auto flex max-w-3xl items-center justify-center">
                <section className="w-full overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(148,163,184,0.16),_transparent_38%),linear-gradient(to_bottom,_#ffffff,_#f8fafc)] px-6 py-8 sm:px-8 sm:py-9">
                        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-700">
                            Billing update
                        </p>
                        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                            Checkout not completed
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                            No new billing change was completed in this flow, and your current
                            subscription stays as it was before checkout opened.
                        </p>
                    </div>

                    <div className="px-6 py-8 sm:px-8">
                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
                            <p className="text-sm font-semibold text-slate-950">What this means</p>
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                You can return to the dashboard and continue the demo right away.
                                Nothing new was applied during this checkout attempt.
                            </p>
                        </div>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                <p className="text-sm font-medium text-slate-950">
                                    Current subscription
                                </p>
                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                    The existing plan and billing state remain unchanged because
                                    checkout was not finished.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                <p className="text-sm font-medium text-slate-950">Next step</p>
                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                    Return to the dashboard to review the current plan or start the
                                    change plan flow again when you are ready.
                                </p>
                            </div>
                        </div>

                        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                            <button
                                type="button"
                                onClick={goToDashboardNow}
                                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                            >
                                Return to dashboard
                            </button>

                            <p className="text-sm text-slate-500">
                                Redirecting automatically in {secondsRemaining} second
                                {secondsRemaining === 1 ? '' : 's'}...
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
