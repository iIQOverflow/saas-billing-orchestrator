import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import ConsumeUsageButton from '@/components/dashboard/ConsumeUsageButton';
import LogoutButton from '@/components/dashboard/LogoutButton';
import ChangePlanButton from '@/components/dashboard/ChangePlanButton';
import { SESSION_COOKIE } from '@/lib/auth';

type MeResponse = {
    email: string;
    companyName: string;
};

type DashboardSummaryResponse = {
    tenant: {
        companyName: string;
    };
    subscription: {
        planCode: string;
        status: string;
    };
    quota: {
        total: number;
        remaining: number;
        used: number;
        usagePercent: number;
    };
    plans: Array<{
        planCode: string;
        displayName: string;
        monthlyPriceLabel: string;
        quotaTotal: number;
        current: boolean;
    }>;
};

function getStatusBadgeClasses(status: string | undefined): string {
    const normalizedStatus = status?.trim().toLowerCase();

    if (normalizedStatus === 'active') {
        return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
    }

    if (normalizedStatus === 'past_due' || normalizedStatus === 'incomplete') {
        return 'bg-amber-50 text-amber-700 ring-amber-200';
    }

    if (normalizedStatus === 'canceled' || normalizedStatus === 'cancelled') {
        return 'bg-rose-50 text-rose-700 ring-rose-200';
    }

    return 'bg-slate-100 text-slate-700 ring-slate-200';
}

export default async function DashboardPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (!token) {
        redirect('/login');
    }

    const headerStore = await headers();
    const host = headerStore.get('host');

    if (!host) {
        throw new Error('Could not determine the current host.');
    }

    const protocol =
        headerStore.get('x-forwarded-proto') ??
        (process.env.NODE_ENV === 'production' ? 'https' : 'http');

    const cookieHeader = headerStore.get('cookie') ?? '';

    let meData: MeResponse | null = null;
    let summaryData: DashboardSummaryResponse | null = null;

    let meError = '';
    let summaryError = '';

    try {
        const meResponse = await fetch(`${protocol}://${host}/api/me`, {
            method: 'GET',
            headers: {
                cookie: cookieHeader,
            },
            cache: 'no-store',
        });

        if (meResponse.status === 401) {
            redirect('/login');
        }

        if (!meResponse.ok) {
            const rawText = await meResponse.text();
            meError = rawText || `Request failed with status ${meResponse.status}`;
        } else {
            meData = (await meResponse.json()) as MeResponse;
        }
    } catch {
        meError = 'Could not load current user data.';
    }

    try {
        const summaryResponse = await fetch(`${protocol}://${host}/api/dashboard/summary`, {
            method: 'GET',
            headers: {
                cookie: cookieHeader,
            },
            cache: 'no-store',
        });

        if (summaryResponse.status === 401) {
            redirect('/login');
        }

        if (!summaryResponse.ok) {
            const rawText = await summaryResponse.text();
            summaryError = rawText || `Request failed with status ${summaryResponse.status}`;
        } else {
            summaryData = (await summaryResponse.json()) as DashboardSummaryResponse;
        }
    } catch {
        summaryError = 'Could not load dashboard summary.';
    }

    const currentPlan = summaryData?.plans.find((plan) => plan.current) ?? null;
    const availablePlans = summaryData?.plans.filter((plan) => !plan.current) ?? [];
    const usagePercent = summaryData
        ? Math.min(Math.max(summaryData.quota.usagePercent, 0), 100)
        : 0;
    const currentPlanName =
        currentPlan?.displayName ?? summaryData?.subscription.planCode ?? 'Unavailable';
    const workspaceName = summaryData?.tenant.companyName ?? meData?.companyName ?? 'Unavailable';
    const signedInAs = meData?.email ?? 'Unavailable';
    const subscriptionStatus = summaryData?.subscription.status ?? 'Unavailable';
    const quotaTotal = summaryData?.quota.total ?? 0;
    const quotaUsed = summaryData?.quota.used ?? 0;
    const quotaRemaining = summaryData?.quota.remaining ?? 0;

    const summaryCards = [
        {
            label: 'Current plan',
            value: currentPlanName,
            detail: currentPlan?.monthlyPriceLabel ?? 'Plan details available in billing',
        },
        {
            label: 'Subscription status',
            value: subscriptionStatus,
            detail: summaryData?.subscription.planCode ?? 'Status unavailable',
            asBadge: true,
        },
        {
            label: 'Quota used',
            value: summaryData ? `${quotaUsed}` : 'Unavailable',
            detail: summaryData ? `${usagePercent}% of capacity` : 'Usage unavailable',
        },
        {
            label: 'Remaining',
            value: summaryData ? `${quotaRemaining}` : 'Unavailable',
            detail: summaryData ? `of ${quotaTotal} total units` : 'Quota unavailable',
        },
    ];

    const errors = [meError, summaryError].filter(Boolean);

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.08),_transparent_32%),linear-gradient(to_bottom,_#f8fafc,_#eef2ff_38%,_#f8fafc)] px-6 py-10 sm:px-8 sm:py-12">
            <div className="mx-auto max-w-6xl space-y-6">
                <section className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-white/95 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.45)]">
                    <div className="grid gap-8 px-6 py-7 sm:px-8 sm:py-8 lg:grid-cols-[minmax(0,1fr)_290px] lg:items-start">
                        <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
                                Billing overview
                            </p>
                            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-[2.15rem]">
                                Admin billing dashboard
                            </h1>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                                Monitor quota, review subscription state, and move between plans
                                from one focused workspace.
                            </p>

                            <div className="mt-6 flex flex-wrap gap-3">
                                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-600">
                                    Workspace <span className="font-medium text-slate-950">{workspaceName}</span>
                                </div>
                                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-600">
                                    Signed in as <span className="font-medium text-slate-950">{signedInAs}</span>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-[28px] border border-slate-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.08),_transparent_42%),linear-gradient(to_bottom,_#ffffff,_#f8fafc)] p-5 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                Workspace snapshot
                            </p>
                            <div className="mt-5 space-y-4">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                                        Current plan
                                    </p>
                                    <p className="mt-2 text-xl font-semibold text-slate-950">
                                        {currentPlanName}
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3">
                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                                        Status
                                    </p>
                                    <div className="mt-2">
                                        <span
                                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${getStatusBadgeClasses(subscriptionStatus)}`}
                                        >
                                            {subscriptionStatus}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5">
                                <LogoutButton />
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {summaryCards.map((card) => (
                        <article
                            key={card.label}
                            className="rounded-[28px] border border-slate-200/80 bg-white px-5 py-5 shadow-[0_16px_45px_-36px_rgba(15,23,42,0.55)]"
                        >
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                {card.label}
                            </p>

                            {card.asBadge ? (
                                <div className="mt-4">
                                    <span
                                        className={`inline-flex rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ${getStatusBadgeClasses(card.value)}`}
                                    >
                                        {card.value}
                                    </span>
                                </div>
                            ) : (
                                <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                                    {card.value}
                                </p>
                            )}

                            <p className="mt-3 text-sm text-slate-600">{card.detail}</p>
                        </article>
                    ))}
                </section>

                {errors.length > 0 ? (
                    <section className="grid gap-3">
                        {errors.map((errorMessage) => (
                            <p
                                key={errorMessage}
                                className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm"
                            >
                                {errorMessage}
                            </p>
                        ))}
                    </section>
                ) : null}

                <section className="rounded-[32px] border border-slate-200/80 bg-white px-6 py-6 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.45)] sm:px-8 sm:py-8">
                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
                        <div className="min-w-0">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                                        Quota
                                    </p>
                                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                                        Usage capacity
                                    </h2>
                                    <p className="mt-2 text-sm leading-6 text-slate-600">
                                        Review current consumption and available headroom at a
                                        glance.
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                        Usage
                                    </p>
                                    <p className="mt-1 text-xl font-semibold text-slate-950">
                                        {summaryData ? `${usagePercent}%` : 'Unavailable'}
                                    </p>
                                </div>
                            </div>

                            {summaryData ? (
                                <div className="mt-6 space-y-4">
                                    <div className="rounded-[28px] border border-slate-200/80 bg-slate-50/80 p-5 sm:p-6">
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-slate-500">
                                                    Current usage
                                                </p>
                                                <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                                                    {quotaUsed} / {quotaTotal}
                                                </p>
                                                <p className="mt-2 text-sm text-slate-600">
                                                    {quotaRemaining} units remaining
                                                </p>
                                            </div>

                                            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                                    Updated view
                                                </p>
                                                <p className="mt-1 text-sm font-medium text-slate-950">
                                                    Based on live dashboard totals
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-200">
                                            <div
                                                className="h-full rounded-full bg-slate-900"
                                                style={{ width: `${usagePercent}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-3 sm:grid-cols-3">
                                        <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4">
                                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                                Total
                                            </p>
                                            <p className="mt-2 text-xl font-semibold text-slate-950">
                                                {quotaTotal}
                                            </p>
                                        </div>

                                        <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4">
                                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                                Used
                                            </p>
                                            <p className="mt-2 text-xl font-semibold text-slate-950">
                                                {quotaUsed}
                                            </p>
                                        </div>

                                        <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4">
                                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                                Remaining
                                            </p>
                                            <p className="mt-2 text-xl font-semibold text-slate-950">
                                                {quotaRemaining}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                    No dashboard summary available.
                                </p>
                            )}
                        </div>

                        <aside className="rounded-[28px] border border-slate-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.05),_transparent_42%),linear-gradient(to_bottom,_#ffffff,_#f8fafc)] p-5 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                Demo action
                            </p>
                            <h3 className="mt-2 text-xl font-semibold text-slate-950">
                                Consume usage
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                Record a sample usage event and refresh the latest quota totals.
                            </p>

                            <ConsumeUsageButton />
                        </aside>
                    </div>
                </section>

                <section className="rounded-[32px] border border-slate-200/80 bg-white px-6 py-6 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.45)] sm:px-8 sm:py-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div className="max-w-2xl">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                                Plans
                            </p>
                            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                                Change plan
                            </h2>
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                Compare the current subscription with the other plans available to
                                this workspace.
                            </p>
                        </div>
                    </div>

                    {summaryData ? (
                        <div className="mt-6 space-y-5">
                            <div className="rounded-[28px] border border-emerald-200/70 bg-emerald-50/70 p-5 sm:p-6">
                                <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                                                Current plan
                                            </p>
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${getStatusBadgeClasses(subscriptionStatus)}`}
                                            >
                                                {subscriptionStatus}
                                            </span>
                                        </div>

                                        <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                                            {currentPlanName}
                                        </h3>
                                        <p className="mt-2 text-sm text-slate-600">
                                            {currentPlan?.monthlyPriceLabel ?? 'Price unavailable'}
                                        </p>
                                    </div>

                                    <dl className="grid gap-3 sm:grid-cols-3">
                                        <div className="rounded-2xl border border-emerald-200/70 bg-white/70 px-4 py-3">
                                            <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                                Plan code
                                            </dt>
                                            <dd className="mt-2 text-sm font-semibold text-slate-950">
                                                {summaryData.subscription.planCode}
                                            </dd>
                                        </div>

                                        <div className="rounded-2xl border border-emerald-200/70 bg-white/70 px-4 py-3">
                                            <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                                Monthly
                                            </dt>
                                            <dd className="mt-2 text-sm font-semibold text-slate-950">
                                                {currentPlan?.monthlyPriceLabel ?? 'Unavailable'}
                                            </dd>
                                        </div>

                                        <div className="rounded-2xl border border-emerald-200/70 bg-white/70 px-4 py-3">
                                            <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                                Included quota
                                            </dt>
                                            <dd className="mt-2 text-sm font-semibold text-slate-950">
                                                {currentPlan?.quotaTotal ?? quotaTotal} units
                                            </dd>
                                        </div>
                                    </dl>
                                </div>
                            </div>

                            {availablePlans.length > 0 ? (
                                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                    {availablePlans.map((plan) => (
                                        <article
                                            key={plan.planCode}
                                            className="flex h-full flex-col rounded-[28px] border border-slate-200/80 bg-slate-50/75 p-5 shadow-[0_16px_45px_-36px_rgba(15,23,42,0.55)]"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <h3 className="text-xl font-semibold text-slate-950">
                                                        {plan.displayName}
                                                    </h3>
                                                    <p className="mt-2 text-sm text-slate-600">
                                                        {plan.monthlyPriceLabel}
                                                    </p>
                                                </div>

                                                <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                                                    {plan.planCode}
                                                </span>
                                            </div>

                                            <div className="mt-6 grid gap-3 sm:grid-cols-2">
                                                <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3">
                                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                                        Monthly
                                                    </p>
                                                    <p className="mt-2 text-sm font-semibold text-slate-950">
                                                        {plan.monthlyPriceLabel}
                                                    </p>
                                                </div>

                                                <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3">
                                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                                        Quota
                                                    </p>
                                                    <p className="mt-2 text-sm font-semibold text-slate-950">
                                                        {plan.quotaTotal} units
                                                    </p>
                                                </div>
                                            </div>

                                            <p className="mt-5 text-sm leading-6 text-slate-600">
                                                {plan.planCode === 'FREE'
                                                    ? 'Return to the included plan without starting checkout.'
                                                    : 'Continue to checkout for this plan.'}
                                            </p>

                                            <div className="mt-auto pt-5">
                                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                                    Change plan
                                                </p>

                                                {plan.planCode === 'FREE' ? (
                                                    <div className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-600">
                                                        Included plan. No checkout required.
                                                    </div>
                                                ) : (
                                                    <ChangePlanButton
                                                        planCode={plan.planCode}
                                                        displayName={plan.displayName}
                                                    />
                                                )}
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            ) : (
                                <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                    No other plans are available right now.
                                </p>
                            )}
                        </div>
                    ) : (
                        <p className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                            No dashboard summary available.
                        </p>
                    )}
                </section>
            </div>
        </main>
    );
}
