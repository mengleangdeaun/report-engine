export function formatNotificationTime(dateString, t, i18n) {
    const date = new Date(dateString);
    const now = new Date();

    const diffMs = now - date;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);

    const isToday = date.toDateString() === now.toDateString();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    // 🔹 Today → relative
    if (isToday) {
        if (diffSeconds < 60) {
            return t('time.just_now');
        }

        if (diffMinutes < 60) {
            return t('time.minute_ago', { count: diffMinutes });
        }

        return diffHours === 1
            ? t('time.hour_ago', { count: 1 })
            : t('time.hours_ago', { count: diffHours });
    }

    // 🔹 Yesterday
    if (isYesterday) {
        return `${t('time.yesterday')}, ${date.toLocaleTimeString(
            i18n.language === 'kh' ? 'en-US' : i18n.language,
            {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            }
        )}`;
    }

    // 🔹 Older dates
    return date.toLocaleString(
        i18n.language === 'kh' ? 'en-GB' : i18n.language,
        {
            day: '2-digit',
            month: 'short',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        }
    );
}
