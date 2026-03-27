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
        <main className="min-h-screen bg-slate-100 px-6 py-16 sm:py-20">
            <div className="mx-auto flex max-w-3xl items-center justify-center">
                <section className="w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.14),_transparent_42%),linear-gradient(to_bottom,_#ffffff,_#f8fafc)] px-6 py-8 sm:px-8">
                        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">
                            Billing update
                        </p>
                        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                            Payment submitted
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                            Your checkout was accepted. The billing update is now being finalized
                            asynchronously, and the dashboard will refresh on return.
                        </p>
                    </div>

                    <div className="px-6 py-8 sm:px-8">
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5">
                            <p className="text-sm font-medium text-emerald-950">
                                What happens now
                            </p>
                            <p className="mt-2 text-sm leading-6 text-emerald-900">
                                The payment request has been submitted successfully, and the backend
                                webhook is responsible for finishing the billing change after
                                checkout closes.
                            </p>
                        </div>

                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                <p className="text-sm font-medium text-slate-950">
                                    Back in the dashboard
                                </p>
                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                    When you return, the app refreshes the dashboard and requests
                                    the latest
                                    <code className="mx-1 rounded bg-white px-1 py-0.5 text-xs text-slate-700">
                                        /api/dashboard/summary
                                    </code>
                                    data again.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                <p className="text-sm font-medium text-slate-950">
                                    If the update is still pending
                                </p>
                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                    If the new plan does not appear immediately, give the webhook a
                                    few seconds to finish and refresh the dashboard once more.
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
