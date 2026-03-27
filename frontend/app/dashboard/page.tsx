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
    const currentPlanName = currentPlan?.displayName ?? summaryData?.subscription.planCode ?? 'Unavailable';
    const workspaceName = summaryData?.tenant.companyName ?? meData?.companyName ?? 'Unavailable';
    const signedInAs = meData?.email ?? 'Unavailable';

    return (
        <main className="min-h-screen bg-slate-100 px-6 py-10 sm:px-8 sm:py-12">
            <div className="mx-auto max-w-7xl space-y-8">
                <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.14),_transparent_38%),linear-gradient(to_bottom,_#ffffff,_#f8fafc)] px-6 py-8 sm:px-8 sm:py-9">
                        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                            <div className="max-w-3xl">
                                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-700">
                                    Workspace overview
                                </p>
                                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-[2rem]">
                                    Billing operations dashboard
                                </h1>
                                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                                    Review the active workspace, current subscription, quota usage,
                                    and available plans in one place.
                                </p>
                            </div>

                            <div className="shrink-0">
                                <LogoutButton />
                            </div>
                        </div>

                        <dl className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <div className="rounded-2xl border border-slate-200 bg-white/85 p-5">
                                <dt className="text-sm font-medium text-slate-500">Workspace</dt>
                                <dd className="mt-3 text-lg font-semibold text-slate-950">
                                    {workspaceName}
                                </dd>
                                <dd className="mt-1 text-sm text-slate-600">Tenant workspace</dd>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white/85 p-5">
                                <dt className="text-sm font-medium text-slate-500">
                                    Current user
                                </dt>
                                <dd className="mt-3 text-lg font-semibold text-slate-950">
                                    {signedInAs}
                                </dd>
                                <dd className="mt-1 text-sm text-slate-600">
                                    Active admin session
                                </dd>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white/85 p-5">
                                <dt className="text-sm font-medium text-slate-500">
                                    Current subscription
                                </dt>
                                <dd className="mt-3 text-lg font-semibold text-slate-950">
                                    {currentPlanName}
                                </dd>
                                <dd className="mt-1 text-sm text-slate-600">
                                    {summaryData?.subscription.status ?? 'Unavailable'}
                                </dd>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white/85 p-5">
                                <dt className="text-sm font-medium text-slate-500">
                                    Quota usage
                                </dt>
                                <dd className="mt-3 text-lg font-semibold text-slate-950">
                                    {summaryData
                                        ? `${summaryData.quota.used} of ${summaryData.quota.total}`
                                        : 'Unavailable'}
                                </dd>
                                <dd className="mt-1 text-sm text-slate-600">
                                    {summaryData
                                        ? `${summaryData.quota.remaining} remaining`
                                        : 'Usage details unavailable'}
                                </dd>
                            </div>
                        </dl>
                    </div>
                </section>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-950">
                                    Current user
                                </h2>
                                <p className="mt-1 text-sm leading-6 text-slate-600">
                                    Details for the admin account currently signed in.
                                </p>
                            </div>
                        </div>

                        {meError ? (
                            <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {meError}
                            </p>
                        ) : meData ? (
                            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                    <dt className="text-sm font-medium text-slate-500">Email</dt>
                                    <dd className="mt-3 text-base font-medium text-slate-950">
                                        {meData.email}
                                    </dd>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                    <dt className="text-sm font-medium text-slate-500">
                                        Company
                                    </dt>
                                    <dd className="mt-3 text-base font-medium text-slate-950">
                                        {meData.companyName}
                                    </dd>
                                </div>
                            </dl>
                        ) : (
                            <p className="mt-5 text-sm text-slate-600">No user data available.</p>
                        )}
                    </section>

                    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-950">
                                Current subscription
                            </h2>
                            <p className="mt-1 text-sm leading-6 text-slate-600">
                                The active plan, status, and pricing for this workspace.
                            </p>
                        </div>

                        {summaryError ? (
                            <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {summaryError}
                            </p>
                        ) : summaryData ? (
                            <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
                                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500">
                                            Current plan
                                        </p>
                                        <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                                            {currentPlanName}
                                        </p>
                                    </div>

                                    <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                                        {summaryData.subscription.status}
                                    </div>
                                </div>

                                <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                        <dt className="text-sm font-medium text-slate-500">
                                            Plan code
                                        </dt>
                                        <dd className="mt-2 text-base font-medium text-slate-950">
                                            {summaryData.subscription.planCode}
                                        </dd>
                                    </div>

                                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                        <dt className="text-sm font-medium text-slate-500">
                                            Monthly price
                                        </dt>
                                        <dd className="mt-2 text-base font-medium text-slate-950">
                                            {currentPlan?.monthlyPriceLabel ?? 'Unavailable'}
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                        ) : (
                            <p className="mt-5 text-sm text-slate-600">
                                No dashboard summary available.
                            </p>
                        )}
                    </section>

                    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-7 xl:col-span-2">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div className="max-w-2xl">
                                <h2 className="text-lg font-semibold text-slate-950">
                                    Quota usage
                                </h2>
                                <p className="mt-1 text-sm leading-6 text-slate-600">
                                    Monitor current usage and demo quota changes without leaving the
                                    dashboard.
                                </p>
                            </div>
                        </div>

                        {summaryError ? (
                            <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {summaryError}
                            </p>
                        ) : summaryData ? (
                            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.9fr)]">
                                <div className="space-y-5">
                                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                            <p className="text-sm font-medium text-slate-500">
                                                Total quota
                                            </p>
                                            <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                                                {summaryData.quota.total}
                                            </p>
                                        </div>

                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                            <p className="text-sm font-medium text-slate-500">
                                                Used
                                            </p>
                                            <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                                                {summaryData.quota.used}
                                            </p>
                                        </div>

                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                            <p className="text-sm font-medium text-slate-500">
                                                Remaining
                                            </p>
                                            <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                                                {summaryData.quota.remaining}
                                            </p>
                                        </div>

                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                            <p className="text-sm font-medium text-slate-500">
                                                Usage
                                            </p>
                                            <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                                                {summaryData.quota.usagePercent}%
                                            </p>
                                        </div>
                                    </div>

                                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-slate-900">
                                                    Capacity used
                                                </p>
                                                <p className="mt-1 text-sm text-slate-600">
                                                    {summaryData.quota.used} used and{' '}
                                                    {summaryData.quota.remaining} remaining
                                                </p>
                                            </div>

                                            <p className="text-sm font-medium text-slate-700">
                                                {usagePercent}% of total quota
                                            </p>
                                        </div>

                                        <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
                                            <div
                                                className="h-full rounded-full bg-slate-900"
                                                style={{ width: `${usagePercent}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
                                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                                        Demo action
                                    </p>
                                    <h3 className="mt-3 text-xl font-semibold text-slate-950">
                                        Consume usage
                                    </h3>
                                    <p className="mt-2 text-sm leading-6 text-slate-600">
                                        Use this control during the walkthrough to refresh quota
                                        totals from the current backend state.
                                    </p>

                                    <ConsumeUsageButton />
                                </div>
                            </div>
                        ) : (
                            <p className="mt-5 text-sm text-slate-600">
                                No dashboard summary available.
                            </p>
                        )}
                    </section>

                    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-7 xl:col-span-2">
                        <div className="max-w-2xl">
                            <h2 className="text-lg font-semibold text-slate-950">
                                Available plans
                            </h2>
                            <p className="mt-1 text-sm leading-6 text-slate-600">
                                Review the current subscription and compare the remaining plan
                                options for this workspace.
                            </p>
                        </div>

                        {summaryError ? (
                            <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {summaryError}
                            </p>
                        ) : summaryData ? (
                            <div className="mt-6 space-y-5">
                                <div className="rounded-3xl border border-emerald-200 bg-emerald-50/80 p-5 sm:p-6">
                                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                                        <div>
                                            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
                                                Current subscription
                                            </p>
                                            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                                                {currentPlanName}
                                            </h3>
                                            <p className="mt-2 text-sm text-slate-600">
                                                {currentPlan?.monthlyPriceLabel ?? 'Price unavailable'}
                                            </p>
                                        </div>

                                        <dl className="grid gap-4 sm:grid-cols-2">
                                            <div className="rounded-2xl border border-emerald-200 bg-white/80 p-4">
                                                <dt className="text-sm font-medium text-slate-500">
                                                    Status
                                                </dt>
                                                <dd className="mt-2 text-base font-medium text-slate-950">
                                                    {summaryData.subscription.status}
                                                </dd>
                                            </div>

                                            <div className="rounded-2xl border border-emerald-200 bg-white/80 p-4">
                                                <dt className="text-sm font-medium text-slate-500">
                                                    Included quota
                                                </dt>
                                                <dd className="mt-2 text-base font-medium text-slate-950">
                                                    {currentPlan?.quotaTotal ?? summaryData.quota.total}
                                                </dd>
                                            </div>
                                        </dl>
                                    </div>
                                </div>

                                {availablePlans.length > 0 ? (
                                    <ul className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                                        {availablePlans.map((plan) => (
                                            <li
                                                key={plan.planCode}
                                                className="flex h-full flex-col rounded-3xl border border-slate-200 bg-slate-50 p-5"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="text-lg font-semibold text-slate-950">
                                                            {plan.displayName}
                                                        </p>
                                                        <p className="mt-1 text-sm text-slate-500">
                                                            {plan.planCode}
                                                        </p>
                                                    </div>

                                                    <div className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                                                        Change plan
                                                    </div>
                                                </div>

                                                <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                                                    <div>
                                                        <dt className="text-sm font-medium text-slate-500">
                                                            Monthly price
                                                        </dt>
                                                        <dd className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                                                            {plan.monthlyPriceLabel}
                                                        </dd>
                                                    </div>

                                                    <div>
                                                        <dt className="text-sm font-medium text-slate-500">
                                                            Included quota
                                                        </dt>
                                                        <dd className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                                                            {plan.quotaTotal}
                                                        </dd>
                                                        <dd className="text-sm text-slate-500">
                                                            units
                                                        </dd>
                                                    </div>
                                                </dl>

                                                <p className="mt-5 text-sm leading-6 text-slate-600">
                                                    {plan.planCode === 'FREE'
                                                        ? 'Return to the included plan without starting a paid checkout flow.'
                                                        : 'Start checkout to change this workspace to the selected paid plan.'}
                                                </p>

                                                <div className="mt-auto pt-5">
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
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                        No other plans are available right now.
                                    </p>
                                )}
                            </div>
                        ) : (
                            <p className="mt-5 text-sm text-slate-600">
                                No dashboard summary available.
                            </p>
                        )}
                    </section>
                </div>
            </div>
        </main>
    );
}
