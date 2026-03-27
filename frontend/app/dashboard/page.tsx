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
        <main className="min-h-screen bg-slate-100 px-6 py-10">
            <div className="mx-auto max-w-6xl">
                <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.14),_transparent_42%),linear-gradient(to_bottom,_#ffffff,_#f8fafc)] px-6 py-7 sm:px-8">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                            <div className="max-w-2xl">
                                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-700">
                                    Workspace overview
                                </p>
                                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                                    Dashboard
                                </h1>
                                <p className="mt-3 text-sm leading-6 text-slate-600">
                                    See who is signed in, where the subscription stands, and how
                                    much quota is left for the team.
                                </p>
                            </div>

                            <div className="shrink-0">
                                <LogoutButton />
                            </div>
                        </div>

                        <div className="mt-6 grid gap-4 md:grid-cols-3">
                            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                                <p className="text-sm text-slate-500">Workspace</p>
                                <p className="mt-2 text-lg font-semibold text-slate-950">
                                    {workspaceName}
                                </p>
                                <p className="mt-1 text-sm text-slate-600">{signedInAs}</p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                                <p className="text-sm text-slate-500">Current plan</p>
                                <p className="mt-2 text-lg font-semibold text-slate-950">
                                    {currentPlanName}
                                </p>
                                <p className="mt-1 text-sm text-slate-600">
                                    Status: {summaryData?.subscription.status ?? 'Unavailable'}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                                <p className="text-sm text-slate-500">Quota remaining</p>
                                <p className="mt-2 text-lg font-semibold text-slate-950">
                                    {summaryData
                                        ? `${summaryData.quota.remaining} of ${summaryData.quota.total}`
                                        : 'Unavailable'}
                                </p>
                                <p className="mt-1 text-sm text-slate-600">
                                    {summaryData
                                        ? `${summaryData.quota.used} used`
                                        : 'Usage details unavailable'}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="mt-8 grid gap-6 xl:grid-cols-2">
                    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-950">
                                    Current user
                                </h2>
                                <p className="mt-1 text-sm text-slate-600">
                                    Account details for the active session.
                                </p>
                            </div>
                        </div>

                        {meError ? (
                            <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {meError}
                            </p>
                        ) : meData ? (
                            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <dt className="text-sm text-slate-500">Email</dt>
                                    <dd className="mt-2 text-base font-medium text-slate-950">
                                        {meData.email}
                                    </dd>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <dt className="text-sm text-slate-500">Company</dt>
                                    <dd className="mt-2 text-base font-medium text-slate-950">
                                        {meData.companyName}
                                    </dd>
                                </div>
                            </dl>
                        ) : (
                            <p className="mt-4 text-sm text-slate-600">No user data available.</p>
                        )}
                    </section>

                    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-950">
                                Current subscription
                            </h2>
                            <p className="mt-1 text-sm text-slate-600">
                                Your plan and billing status at a glance.
                            </p>
                        </div>

                        {summaryError ? (
                            <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {summaryError}
                            </p>
                        ) : summaryData ? (
                            <div className="mt-6 space-y-4">
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm text-slate-500">Plan</p>
                                            <p className="mt-2 text-xl font-semibold text-slate-950">
                                                {currentPlanName}
                                            </p>
                                        </div>

                                        <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                                            {summaryData.subscription.status}
                                        </div>
                                    </div>

                                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <p className="text-sm text-slate-500">Plan code</p>
                                            <p className="mt-2 text-base font-medium text-slate-950">
                                                {summaryData.subscription.planCode}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-sm text-slate-500">Monthly price</p>
                                            <p className="mt-2 text-base font-medium text-slate-950">
                                                {currentPlan?.monthlyPriceLabel ?? 'Unavailable'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="mt-4 text-sm text-slate-600">
                                No dashboard summary available.
                            </p>
                        )}
                    </section>

                    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-950">Quota usage</h2>
                            <p className="mt-1 text-sm text-slate-600">
                                Track how much usage is left before the next limit is reached.
                            </p>
                        </div>

                        {summaryError ? (
                            <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {summaryError}
                            </p>
                        ) : summaryData ? (
                            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]">
                                <div>
                                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                            <p className="text-sm text-slate-500">Total quota</p>
                                            <p className="mt-2 text-2xl font-semibold text-slate-950">
                                                {summaryData.quota.total}
                                            </p>
                                        </div>

                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                            <p className="text-sm text-slate-500">Used</p>
                                            <p className="mt-2 text-2xl font-semibold text-slate-950">
                                                {summaryData.quota.used}
                                            </p>
                                        </div>

                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                            <p className="text-sm text-slate-500">Remaining</p>
                                            <p className="mt-2 text-2xl font-semibold text-slate-950">
                                                {summaryData.quota.remaining}
                                            </p>
                                        </div>

                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                            <p className="text-sm text-slate-500">Usage</p>
                                            <p className="mt-2 text-2xl font-semibold text-slate-950">
                                                {summaryData.quota.usagePercent}%
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="text-sm font-medium text-slate-900">
                                                Capacity used
                                            </p>
                                            <p className="text-sm text-slate-600">
                                                {summaryData.quota.used} of {summaryData.quota.total}
                                            </p>
                                        </div>

                                        <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
                                            <div
                                                className="h-full rounded-full bg-slate-900 transition-[width]"
                                                style={{ width: `${usagePercent}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                    <p className="text-sm font-semibold text-slate-950">
                                        Demo quota update
                                    </p>
                                    <p className="mt-2 text-sm text-slate-600">
                                        Use one unit and refresh the totals instantly.
                                    </p>

                                    <ConsumeUsageButton />
                                </div>
                            </div>
                        ) : (
                            <p className="mt-4 text-sm text-slate-600">
                                No dashboard summary available.
                            </p>
                        )}
                    </section>

                    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-950">
                                Available plans
                            </h2>
                            <p className="mt-1 text-sm text-slate-600">
                                Compare your current plan with the other options.
                            </p>
                        </div>

                        {summaryError ? (
                            <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {summaryError}
                            </p>
                        ) : summaryData ? (
                            <div className="mt-6 space-y-4">
                                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5">
                                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                        <div>
                                            <p className="text-sm font-semibold text-emerald-700">
                                                Current plan
                                            </p>
                                            <h3 className="mt-2 text-xl font-semibold text-slate-950">
                                                {currentPlanName}
                                            </h3>
                                            <p className="mt-2 text-sm text-slate-600">
                                                {currentPlan?.monthlyPriceLabel ?? 'Price unavailable'}
                                            </p>
                                        </div>

                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <div className="rounded-2xl border border-emerald-200 bg-white/80 p-4">
                                                <p className="text-sm text-slate-500">Status</p>
                                                <p className="mt-2 text-base font-medium text-slate-950">
                                                    {summaryData.subscription.status}
                                                </p>
                                            </div>

                                            <div className="rounded-2xl border border-emerald-200 bg-white/80 p-4">
                                                <p className="text-sm text-slate-500">
                                                    Included quota
                                                </p>
                                                <p className="mt-2 text-base font-medium text-slate-950">
                                                    {currentPlan?.quotaTotal ?? summaryData.quota.total}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {availablePlans.length > 0 ? (
                                    <ul className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                                        {availablePlans.map((plan) => (
                                            <li
                                                key={plan.planCode}
                                                className="flex h-full flex-col rounded-2xl border border-slate-200 bg-slate-50 p-5"
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

                                                    <div className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                                                        Available
                                                    </div>
                                                </div>

                                                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                                    <div>
                                                        <p className="text-sm text-slate-500">
                                                            Monthly price
                                                        </p>
                                                        <p className="mt-2 text-2xl font-semibold text-slate-950">
                                                            {plan.monthlyPriceLabel}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <p className="text-sm text-slate-500">
                                                            Included quota
                                                        </p>
                                                        <p className="mt-2 text-2xl font-semibold text-slate-950">
                                                            {plan.quotaTotal}
                                                        </p>
                                                        <p className="text-sm text-slate-500">
                                                            units
                                                        </p>
                                                    </div>
                                                </div>

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
                            <p className="mt-4 text-sm text-slate-600">
                                No dashboard summary available.
                            </p>
                        )}
                    </section>
                </div>
            </div>
        </main>
    );
}
