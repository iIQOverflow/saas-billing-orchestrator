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
        <main className="min-h-screen bg-slate-100 px-6 py-16 sm:px-8 sm:py-20">
            <div className="mx-auto flex max-w-3xl items-center justify-center">
                <section className="w-full overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.14),_transparent_38%),linear-gradient(to_bottom,_#ffffff,_#f8fafc)] px-6 py-8 sm:px-8 sm:py-9">
                        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">
                            Billing update
                        </p>
                        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                            Checkout completed
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                            Your payment was submitted successfully. The subscription change is now
                            being finalized asynchronously by the backend webhook.
                        </p>
                    </div>

                    <div className="px-6 py-8 sm:px-8">
                        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/80 p-5 sm:p-6">
                            <p className="text-sm font-semibold text-emerald-950">
                                What to expect
                            </p>
                            <p className="mt-2 text-sm leading-6 text-emerald-900">
                                You will return to the dashboard in a moment. The app refreshes on
                                return so the latest billing state can appear as soon as the
                                webhook finishes processing.
                            </p>
                        </div>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                <p className="text-sm font-medium text-slate-950">
                                    Dashboard refresh
                                </p>
                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                    The dashboard reloads automatically when you return, so the
                                    interview flow can continue with the newest backend data.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                <p className="text-sm font-medium text-slate-950">
                                    If the update is still pending
                                </p>
                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                    Give the webhook a few more seconds and refresh again if the
                                    new subscription details have not appeared yet.
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
