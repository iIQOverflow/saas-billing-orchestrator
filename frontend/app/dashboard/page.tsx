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

function formatStatusLabel(status: string | undefined): string {
    if (!status) {
        return 'Unavailable';
    }

    return status
        .trim()
        .split('_')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
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
    const subscriptionStatusLabel = formatStatusLabel(subscriptionStatus);
    const quotaTotal = summaryData?.quota.total ?? 0;
    const quotaUsed = summaryData?.quota.used ?? 0;
    const quotaRemaining = summaryData?.quota.remaining ?? 0;
    const currentPlanQuota = currentPlan?.quotaTotal ?? quotaTotal;

    const summaryCards = [
        {
            label: 'Workspace',
            value: workspaceName,
            detail: summaryData ? 'Billing workspace' : 'Workspace unavailable',
        },
        {
            label: 'Signed-in user',
            value: signedInAs,
            detail: meData ? 'Admin session' : 'User unavailable',
        },
        {
            label: 'Current plan',
            value: currentPlanName,
            detail: currentPlan?.monthlyPriceLabel ?? 'Plan details unavailable',
        },
        {
            label: 'Remaining quota',
            value: summaryData ? `${quotaRemaining}` : 'Unavailable',
            detail: summaryData
                ? `${quotaUsed} used of ${quotaTotal} total units`
                : 'Quota details unavailable',
        },
    ];

    const errors = [meError, summaryError].filter(Boolean);

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.11),_transparent_32%),linear-gradient(to_bottom,_#f6f8fb,_#edf2f7_44%,_#f7f9fc)] px-5 py-6 sm:px-7 sm:py-8 lg:px-8">
            <div className="mx-auto max-w-[1120px] space-y-5">
                <section className="relative overflow-hidden rounded-[34px] border border-slate-200/80 bg-white/92 shadow-[0_34px_90px_-54px_rgba(15,23,42,0.4)] backdrop-blur">
                    <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,_rgba(125,211,252,0.28),_transparent_55%),linear-gradient(180deg,_rgba(248,250,252,0.9),_rgba(255,255,255,0))]" />
                    <div className="relative px-6 py-6 sm:px-8 sm:py-8">
                        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                            <div className="max-w-2xl">
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
                                    Billing workspace
                                </p>
                                <div className="mt-3 flex flex-wrap items-center gap-3">
                                    <h1 className="text-[2rem] font-semibold tracking-tight text-slate-950 sm:text-[2.45rem]">
                                        Dashboard
                                    </h1>
                                    <span
                                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getStatusBadgeClasses(subscriptionStatus)}`}
                                    >
                                        {subscriptionStatusLabel}
                                    </span>
                                </div>
                                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-700">
                                    Plan state, quota health, and billing actions in one focused
                                    admin surface.
                                </p>
                            </div>

                            <div className="flex items-center justify-between gap-3 xl:justify-end">
                                <div className="rounded-full border border-slate-200/90 bg-white/80 px-4 py-2 text-sm text-slate-700 shadow-[0_14px_30px_-24px_rgba(15,23,42,0.8)]">
                                    Admin session
                                </div>
                                <LogoutButton />
                            </div>
                        </div>

                        <div className="mt-8 rounded-[28px] border border-slate-200/90 bg-slate-50/80 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
                            <dl className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                                {summaryCards.map((card) => (
                                    <div
                                        key={card.label}
                                        className="rounded-[22px] bg-white/85 px-4 py-4 shadow-[0_16px_36px_-32px_rgba(15,23,42,0.45)]"
                                    >
                                        <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-600">
                                            {card.label}
                                        </dt>
                                        <dd className="mt-3 break-words text-lg font-semibold tracking-tight text-slate-950">
                                            {card.value}
                                        </dd>
                                        <p className="mt-2 text-sm text-slate-700">{card.detail}</p>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    </div>
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

                <section className="rounded-[34px] border border-slate-200/80 bg-white/94 px-6 py-6 shadow-[0_30px_82px_-52px_rgba(15,23,42,0.38)] sm:px-8 sm:py-8">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div className="max-w-xl">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
                                Quota
                            </p>
                            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                                Usage overview
                            </h2>
                            <p className="mt-2 text-sm leading-6 text-slate-700">
                                Current usage, remaining capacity, and the live consume action.
                            </p>
                        </div>
                    </div>

                    {summaryData ? (
                        <div className="mt-7 grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_300px]">
                            <div className="rounded-[30px] border border-slate-200/90 bg-[linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.94))] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] sm:p-7">
                                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-600">
                                            Current usage
                                        </p>
                                        <div className="mt-3 flex flex-wrap items-end gap-3">
                                            <p className="text-5xl font-semibold tracking-tight text-slate-950 sm:text-[3.5rem]">
                                                {quotaUsed}
                                            </p>
                                            <p className="pb-1 text-sm text-slate-600">
                                                of {quotaTotal} total units
                                            </p>
                                        </div>
                                    </div>

                                    <div className="inline-flex rounded-full border border-slate-300/70 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700 shadow-sm">
                                        {usagePercent}% used
                                    </div>
                                </div>

                                <div className="mt-8">
                                    <div className="flex items-center justify-between gap-3 text-sm text-slate-700">
                                        <span>Remaining {quotaRemaining}</span>
                                        <span>Total {quotaTotal}</span>
                                    </div>
                                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200/80">
                                        <div
                                            className="h-full rounded-full bg-slate-950"
                                            style={{ width: `${usagePercent}%` }}
                                        />
                                    </div>
                                </div>

                                <dl className="mt-8 grid gap-3 sm:grid-cols-3">
                                    <div className="rounded-2xl bg-white px-4 py-4 ring-1 ring-slate-300/60">
                                        <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                                            Used
                                        </dt>
                                        <dd className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                                            {quotaUsed}
                                        </dd>
                                    </div>
                                    <div className="rounded-2xl bg-white px-4 py-4 ring-1 ring-slate-300/60">
                                        <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                                            Remaining
                                        </dt>
                                        <dd className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                                            {quotaRemaining}
                                        </dd>
                                    </div>
                                    <div className="rounded-2xl bg-white px-4 py-4 ring-1 ring-slate-300/60">
                                        <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                                            Total
                                        </dt>
                                        <dd className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                                            {quotaTotal}
                                        </dd>
                                    </div>
                                </dl>
                            </div>

                            <aside className="rounded-[30px] border border-slate-200/90 bg-slate-50/90 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] sm:p-6">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                                    Live action
                                </p>
                                <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
                                    Consume usage
                                </h3>
                                <p className="mt-2 text-sm leading-6 text-slate-700">
                                    Record a sample usage event and refresh the latest totals.
                                </p>

                                <div className="mt-6 rounded-[24px] bg-white px-4 py-4 ring-1 ring-slate-300/60">
                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                                        Current remaining
                                    </p>
                                    <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                                        {quotaRemaining}
                                    </p>
                                </div>

                                <div className="mt-6">
                                    <ConsumeUsageButton />
                                </div>
                            </aside>
                        </div>
                    ) : (
                        <p className="mt-6 rounded-[24px] border border-slate-200/90 bg-slate-50/80 px-4 py-4 text-sm text-slate-700">
                            No dashboard summary available.
                        </p>
                    )}
                </section>

                <section className="rounded-[34px] border border-slate-200/80 bg-white/94 px-6 py-6 shadow-[0_30px_82px_-52px_rgba(15,23,42,0.38)] sm:px-8 sm:py-8">
                    <div className="max-w-xl">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
                            Plans
                        </p>
                        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                            Change plan
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-slate-700">
                            Keep the current subscription visible while comparing the other plan
                            options for this workspace.
                        </p>
                    </div>

                    {summaryData ? (
                        <div className="mt-7 space-y-5">
                            <div className="rounded-[30px] border border-sky-200/90 bg-[linear-gradient(135deg,_rgba(240,249,255,0.95),_rgba(255,255,255,0.98))] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] sm:p-7">
                                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                                                Current plan
                                            </p>
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${getStatusBadgeClasses(subscriptionStatus)}`}
                                            >
                                                {subscriptionStatusLabel}
                                            </span>
                                        </div>

                                        <h3 className="mt-3 text-[1.9rem] font-semibold tracking-tight text-slate-950">
                                            {currentPlanName}
                                        </h3>
                                        <p className="mt-2 text-sm text-slate-700">
                                            {currentPlan?.monthlyPriceLabel ?? 'Price unavailable'}
                                        </p>
                                    </div>

                                    <dl className="grid gap-3 sm:grid-cols-3">
                                        <div className="rounded-2xl bg-white px-4 py-4 ring-1 ring-sky-200/80">
                                            <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                                                Plan code
                                            </dt>
                                            <dd className="mt-2 text-sm font-semibold text-slate-950">
                                                {summaryData.subscription.planCode}
                                            </dd>
                                        </div>
                                        <div className="rounded-2xl bg-white px-4 py-4 ring-1 ring-sky-200/80">
                                            <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                                                Monthly
                                            </dt>
                                            <dd className="mt-2 text-sm font-semibold text-slate-950">
                                                {currentPlan?.monthlyPriceLabel ?? 'Unavailable'}
                                            </dd>
                                        </div>
                                        <div className="rounded-2xl bg-white px-4 py-4 ring-1 ring-sky-200/80">
                                            <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                                                Included quota
                                            </dt>
                                            <dd className="mt-2 text-sm font-semibold text-slate-950">
                                                {currentPlanQuota} units
                                            </dd>
                                        </div>
                                    </dl>
                                </div>
                            </div>

                            {availablePlans.length > 0 ? (
                                <div className="overflow-hidden rounded-[30px] border border-slate-200/90 bg-slate-50/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
                                    {availablePlans.map((plan, index) => (
                                        <article
                                            key={plan.planCode}
                                            className={`grid gap-5 px-5 py-5 sm:px-6 lg:grid-cols-[minmax(0,1.15fr)_140px_140px_240px] lg:items-center ${
                                                index > 0 ? 'border-t border-slate-200/90' : ''
                                            }`}
                                        >
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="text-lg font-semibold text-slate-950">
                                                        {plan.displayName}
                                                    </h3>
                                                    <span className="inline-flex rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-300/60">
                                                        {plan.planCode}
                                                    </span>
                                                </div>
                                                <p className="mt-2 text-sm leading-6 text-slate-700">
                                                    {plan.planCode === 'FREE'
                                                        ? 'Return to the included plan without starting checkout.'
                                                        : 'Continue to checkout for this plan.'}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                                                    Monthly
                                                </p>
                                                <p className="mt-2 text-sm font-semibold text-slate-950">
                                                    {plan.monthlyPriceLabel}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                                                    Quota
                                                </p>
                                                <p className="mt-2 text-sm font-semibold text-slate-950">
                                                    {plan.quotaTotal} units
                                                </p>
                                            </div>

                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                                                    Change plan
                                                </p>
                                                <div className="mt-3">
                                                    {plan.planCode === 'FREE' ? (
                                                        <div className="rounded-2xl border border-dashed border-slate-300/90 bg-slate-50/80 px-4 py-3 text-sm text-slate-700">
                                                            Included plan. No checkout required.
                                                        </div>
                                                    ) : (
                                                        <ChangePlanButton
                                                            planCode={plan.planCode}
                                                            displayName={plan.displayName}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            ) : (
                                <p className="rounded-[24px] border border-slate-200/90 bg-slate-50/80 px-4 py-4 text-sm text-slate-700">
                                    No other plans are available right now.
                                </p>
                            )}
                        </div>
                    ) : (
                        <p className="mt-6 rounded-[24px] border border-slate-200/90 bg-slate-50/80 px-4 py-4 text-sm text-slate-700">
                            No dashboard summary available.
                        </p>
                    )}
                </section>
            </div>
        </main>
    );
}
