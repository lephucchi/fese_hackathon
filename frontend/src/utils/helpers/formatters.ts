/**
 * Formatting Utilities
 * Currency, number, and date formatters
 */

/**
 * Format number as Vietnamese Dong currency
 */
export function formatVND(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(amount);
}

/**
 * Format number with thousand separators
 */
export function formatNumber(num: number, decimals: number = 0): string {
    return new Intl.NumberFormat('vi-VN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(num);
}

/**
 * Format percentage
 */
export function formatPercent(value: number, decimals: number = 2): string {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Format date to Vietnamese locale
 */
export function formatDate(date: Date, format: 'short' | 'long' | 'relative' = 'short'): string {
    if (format === 'relative') {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Vừa xong';
        if (minutes < 60) return `${minutes} phút trước`;
        if (hours < 24) return `${hours} giờ trước`;
        if (days < 7) return `${days} ngày trước`;
    }

    const options: Intl.DateTimeFormatOptions = format === 'long'
        ? { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
        : { year: 'numeric', month: '2-digit', day: '2-digit' };

    return new Intl.DateTimeFormat('vi-VN', options).format(date);
}

/**
 * Format time
 */
export function formatTime(date: Date): string {
    return new Intl.DateTimeFormat('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}
