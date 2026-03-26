import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import LogoutButton from '@/components/dashboard/LogoutButton';
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

    return (
        <main className="min-h-screen bg-slate-50 px-6 py-10">
            <div className="mx-auto max-w-5xl">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-semibold text-slate-900">Dashboard</h1>
                        <p className="mt-2 text-sm text-slate-600">
                            This dashboard now loads <code>/api/me</code> and{' '}
                            <code>/api/dashboard/summary</code>.
                        </p>
                    </div>

                    <LogoutButton />
                </div>

                <div className="space-y-6">
                    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">Current user</h2>

                        {meError ? (
                            <p className="mt-3 text-sm text-red-600">{meError}</p>
                        ) : meData ? (
                            <div className="mt-4 space-y-3">
                                <div>
                                    <p className="text-sm text-slate-500">Email</p>
                                    <p className="text-base font-medium text-slate-900">{meData.email}</p>
                                </div>

                                <div>
                                    <p className="text-sm text-slate-500">Company</p>
                                    <p className="text-base font-medium text-slate-900">
                                        {meData.companyName}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <p className="mt-3 text-sm text-slate-600">No user data available.</p>
                        )}
                    </section>

                    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">Dashboard summary</h2>

                        {summaryError ? (
                            <p className="mt-3 text-sm text-red-600">{summaryError}</p>
                        ) : summaryData ? (
                            <div className="mt-4 space-y-6">
                                <div>
                                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                                        Tenant
                                    </h3>
                                    <p className="mt-2 text-base font-medium text-slate-900">
                                        {summaryData.tenant.companyName}
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                                        Subscription
                                    </h3>

                                    <div className="mt-2 space-y-2">
                                        <p className="text-sm text-slate-700">
                                            <span className="font-medium text-slate-900">Plan:</span>{' '}
                                            {summaryData.subscription.planCode}
                                        </p>
                                        <p className="text-sm text-slate-700">
                                            <span className="font-medium text-slate-900">Status:</span>{' '}
                                            {summaryData.subscription.status}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                                        Quota
                                    </h3>

                                    <div className="mt-2 space-y-2">
                                        <p className="text-sm text-slate-700">
                                            <span className="font-medium text-slate-900">Total:</span>{' '}
                                            {summaryData.quota.total}
                                        </p>
                                        <p className="text-sm text-slate-700">
                                            <span className="font-medium text-slate-900">Used:</span>{' '}
                                            {summaryData.quota.used}
                                        </p>
                                        <p className="text-sm text-slate-700">
                                            <span className="font-medium text-slate-900">Remaining:</span>{' '}
                                            {summaryData.quota.remaining}
                                        </p>
                                        <p className="text-sm text-slate-700">
                                            <span className="font-medium text-slate-900">Usage percent:</span>{' '}
                                            {summaryData.quota.usagePercent}%
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                                        Available plans
                                    </h3>

                                    <ul className="mt-3 space-y-3">
                                        {summaryData.plans.map((plan) => (
                                            <li
                                                key={plan.planCode}
                                                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        <p className="text-base font-medium text-slate-900">
                                                            {plan.displayName}
                                                        </p>
                                                        <p className="mt-1 text-sm text-slate-600">
                                                            Plan code: {plan.planCode}
                                                        </p>
                                                        <p className="mt-1 text-sm text-slate-600">
                                                            Price: {plan.monthlyPriceLabel}
                                                        </p>
                                                        <p className="mt-1 text-sm text-slate-600">
                                                            Quota total: {plan.quotaTotal}
                                                        </p>
                                                    </div>

                                                    <div className="shrink-0 rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700">
                                                        {plan.current ? 'Current plan' : 'Available'}
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ) : (
                            <p className="mt-3 text-sm text-slate-600">No dashboard summary available.</p>
                        )}
                    </section>
                </div>
            </div>
        </main>
    );
}