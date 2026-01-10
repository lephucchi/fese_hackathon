/**
 * Route Constants
 * Centralized navigation routes
 */

export const ROUTES = {
    HOME: '/',
    DASHBOARD: '/dashboard',
    PERSONAL: '/personal',
    EDUCATION: '/education',
    ABOUT: '/about',
    CHAT: '/chat',
} as const;

export const NAV_ITEMS = [
    { labelKey: 'nav.home', href: ROUTES.HOME },
    { labelKey: 'nav.news', href: ROUTES.DASHBOARD },
    { labelKey: 'nav.personal', href: ROUTES.PERSONAL },
    { labelKey: 'nav.education', href: ROUTES.EDUCATION },
    { labelKey: 'nav.about', href: ROUTES.ABOUT },
] as const;

export type RouteKey = keyof typeof ROUTES;
