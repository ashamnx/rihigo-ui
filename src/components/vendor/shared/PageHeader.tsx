import { component$, Slot } from '@builder.io/qwik';
import { Link } from '@builder.io/qwik-city';

export interface Breadcrumb {
    label: string;
    href?: string;
}

export interface PageHeaderProps {
    title: string;
    subtitle?: string;
    breadcrumbs?: Breadcrumb[];
}

export const PageHeader = component$<PageHeaderProps>(({ title, subtitle, breadcrumbs }) => {
    return (
        <div class="mb-6">
            {/* Breadcrumbs */}
            {breadcrumbs && breadcrumbs.length > 0 && (
                <div class="text-sm breadcrumbs mb-2">
                    <ul>
                        {breadcrumbs.map((crumb, index) => (
                            <li key={index}>
                                {crumb.href ? (
                                    <Link href={crumb.href} class="text-base-content/60 hover:text-base-content">
                                        {crumb.label}
                                    </Link>
                                ) : (
                                    <span class="text-base-content/60">{crumb.label}</span>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Header */}
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 class="text-2xl font-bold text-base-content">{title}</h1>
                    {subtitle && (
                        <p class="mt-1 text-sm text-base-content/60">{subtitle}</p>
                    )}
                </div>
                <div class="flex flex-wrap items-center gap-2">
                    <Slot name="actions" />
                </div>
            </div>
        </div>
    );
});
