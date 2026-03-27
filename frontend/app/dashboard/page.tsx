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

    return (
        <main className="min-h-screen bg-[linear-gradient(to_bottom,_#f8fafc,_#f1f5f9)] px-6 py-10 sm:px-8 sm:py-12">
            <div className="mx-auto max-w-5xl space-y-6">
                <section className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm">
                    <div className="px-6 py-7 sm:px-8 sm:py-8">
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                            <div className="max-w-2xl">
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
                                    Billing
                                </p>
                                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-[2rem]">
                                    Billing dashboard
                                </h1>
                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                    Workspace status, quota, and plan changes in one view.
                                </p>
                            </div>

                            <div className="shrink-0">
                                <LogoutButton />
                            </div>
                        </div>

                        <div className="mt-6 overflow-hidden rounded-2xl bg-slate-200">
                            <dl className="grid gap-px sm:grid-cols-2 lg:grid-cols-4">
                                <div className="bg-slate-50/90 px-5 py-4">
                                    <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                        Workspace
                                    </dt>
                                    <dd className="mt-2 text-base font-semibold text-slate-950">
                                        {workspaceName}
                                    </dd>
                                </div>

                                <div className="bg-slate-50/90 px-5 py-4">
                                    <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                        Signed in as
                                    </dt>
                                    <dd className="mt-2 text-base font-semibold text-slate-950">
                                        {signedInAs}
                                    </dd>
                                </div>

                                <div className="bg-slate-50/90 px-5 py-4">
                                    <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                        Current plan
                                    </dt>
                                    <dd className="mt-2 text-base font-semibold text-slate-950">
                                        {currentPlanName}
                                    </dd>
                                    <dd className="mt-1 text-sm text-slate-600">
                                        {summaryData?.subscription.status ?? 'Unavailable'}
                                    </dd>
                                </div>

                                <div className="bg-slate-50/90 px-5 py-4">
                                    <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                        Quota
                                    </dt>
                                    <dd className="mt-2 text-base font-semibold text-slate-950">
                                        {summaryData
                                            ? `${summaryData.quota.used} of ${summaryData.quota.total}`
                                            : 'Unavailable'}
                                    </dd>
                                    <dd className="mt-1 text-sm text-slate-600">
                                        {summaryData
                                            ? `${summaryData.quota.remaining} remaining`
                                            : 'Usage unavailable'}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        {meError ? (
                            <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {meError}
                            </p>
                        ) : null}

                        {summaryError ? (
                            <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {summaryError}
                            </p>
                        ) : null}
                    </div>
                </section>

                <section className="rounded-[26px] border border-slate-200 bg-white px-6 py-6 shadow-sm sm:px-8 sm:py-7">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                            <div className="max-w-xl">
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                                    Quota
                                </p>
                                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                                    Usage
                                </h2>
                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                    Current consumption and remaining capacity.
                                </p>
                            </div>

                            {summaryData ? (
                                <div className="mt-6 space-y-5">
                                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                        <div className="rounded-2xl bg-slate-50 px-4 py-4">
                                            <p className="text-sm font-medium text-slate-500">
                                                Total
                                            </p>
                                            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                                                {summaryData.quota.total}
                                            </p>
                                        </div>

                                        <div className="rounded-2xl bg-slate-50 px-4 py-4">
                                            <p className="text-sm font-medium text-slate-500">
                                                Used
                                            </p>
                                            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                                                {summaryData.quota.used}
                                            </p>
                                        </div>

                                        <div className="rounded-2xl bg-slate-50 px-4 py-4">
                                            <p className="text-sm font-medium text-slate-500">
                                                Remaining
                                            </p>
                                            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                                                {summaryData.quota.remaining}
                                            </p>
                                        </div>

                                        <div className="rounded-2xl bg-slate-50 px-4 py-4">
                                            <p className="text-sm font-medium text-slate-500">
                                                Usage
                                            </p>
                                            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                                                {summaryData.quota.usagePercent}%
                                            </p>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl bg-slate-50 px-5 py-5">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-slate-900">
                                                    Capacity used
                                                </p>
                                                <p className="mt-1 text-sm text-slate-600">
                                                    {summaryData.quota.used} used and{' '}
                                                    {summaryData.quota.remaining} remaining
                                                </p>
                                            </div>

                                            <p className="text-lg font-semibold text-slate-950">
                                                {usagePercent}% of quota
                                            </p>
                                        </div>

                                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                                            <div
                                                className="h-full rounded-full bg-slate-900"
                                                style={{ width: `${usagePercent}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="mt-6 text-sm text-slate-600">
                                    No dashboard summary available.
                                </p>
                            )}
                        </div>

                        <div className="lg:w-72 lg:shrink-0">
                            <div className="rounded-2xl bg-slate-50 px-5 py-5">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                    Demo action
                                </p>
                                <h3 className="mt-2 text-xl font-semibold text-slate-950">
                                    Consume usage
                                </h3>
                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                    Refresh quota totals from the current backend state.
                                </p>

                                <ConsumeUsageButton />
                            </div>
                        </div>
                    </div>
                </section>

                <section className="rounded-[26px] border border-slate-200 bg-white px-6 py-6 shadow-sm sm:px-8 sm:py-7">
                    <div className="max-w-xl">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                            Plans
                        </p>
                        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                            Change plan
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                            Current subscription and the plans available for this workspace.
                        </p>
                    </div>

                    {summaryData ? (
                        <div className="mt-6 space-y-4">
                            <div className="rounded-2xl bg-emerald-50/80 px-5 py-5">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                                            Current plan
                                        </p>
                                        <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                                            {currentPlanName}
                                        </h3>
                                        <p className="mt-1 text-sm text-slate-600">
                                            {currentPlan?.monthlyPriceLabel ?? 'Price unavailable'}
                                        </p>
                                    </div>

                                    <dl className="grid gap-4 sm:grid-cols-3">
                                        <div>
                                            <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                                Status
                                            </dt>
                                            <dd className="mt-1 text-sm font-medium text-slate-950">
                                                {summaryData.subscription.status}
                                            </dd>
                                        </div>

                                        <div>
                                            <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                                Plan code
                                            </dt>
                                            <dd className="mt-1 text-sm font-medium text-slate-950">
                                                {summaryData.subscription.planCode}
                                            </dd>
                                        </div>

                                        <div>
                                            <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                                Included quota
                                            </dt>
                                            <dd className="mt-1 text-sm font-medium text-slate-950">
                                                {currentPlan?.quotaTotal ?? summaryData.quota.total}
                                            </dd>
                                        </div>
                                    </dl>
                                </div>
                            </div>

                            {availablePlans.length > 0 ? (
                                <ul className="overflow-hidden rounded-2xl bg-slate-50 ring-1 ring-slate-200">
                                    {availablePlans.map((plan, index) => (
                                        <li
                                            key={plan.planCode}
                                            className={
                                                index === 0
                                                    ? 'px-5 py-5 sm:px-6'
                                                    : 'border-t border-slate-200 px-5 py-5 sm:px-6'
                                            }
                                        >
                                            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h3 className="text-lg font-semibold text-slate-950">
                                                            {plan.displayName}
                                                        </h3>
                                                        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-500 ring-1 ring-slate-200">
                                                            {plan.planCode}
                                                        </span>
                                                        <span className="rounded-full bg-slate-900/5 px-2.5 py-1 text-xs font-semibold text-slate-700">
                                                            Change plan
                                                        </span>
                                                    </div>

                                                    <dl className="mt-4 flex flex-wrap gap-6">
                                                        <div>
                                                            <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                                                Monthly
                                                            </dt>
                                                            <dd className="mt-1 text-base font-semibold text-slate-950">
                                                                {plan.monthlyPriceLabel}
                                                            </dd>
                                                        </div>

                                                        <div>
                                                            <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                                                Quota
                                                            </dt>
                                                            <dd className="mt-1 text-base font-semibold text-slate-950">
                                                                {plan.quotaTotal} units
                                                            </dd>
                                                        </div>
                                                    </dl>

                                                    <p className="mt-3 text-sm text-slate-600">
                                                        {plan.planCode === 'FREE'
                                                            ? 'Return to the included plan without checkout.'
                                                            : 'Continue to checkout for this plan.'}
                                                    </p>
                                                </div>

                                                <div className="lg:w-60 lg:shrink-0">
                                                    {plan.planCode === 'FREE' ? (
                                                        <p className="text-sm text-slate-600">
                                                            Included plan. No checkout required.
                                                        </p>
                                                    ) : (
                                                        <ChangePlanButton
                                                            planCode={plan.planCode}
                                                            displayName={plan.displayName}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                    No other plans are available right now.
                                </p>
                            )}
                        </div>
                    ) : (
                        <p className="mt-6 text-sm text-slate-600">No dashboard summary available.</p>
                    )}
                </section>
            </div>
        </main>
    );
}
