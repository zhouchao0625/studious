import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

async function loadMessages(locale: string) {
  // Load all translation files for the locale
  const messages = await Promise.all([
    import(`../../messages/${locale}/common.json`),
    import(`../../messages/${locale}/navigation.json`),
    import(`../../messages/${locale}/dashboard.json`),
    import(`../../messages/${locale}/classes.json`),
    import(`../../messages/${locale}/attendance.json`),
    import(`../../messages/${locale}/grades.json`),
    import(`../../messages/${locale}/aiLabs.json`),
    import(`../../messages/${locale}/files.json`),
    import(`../../messages/${locale}/assignments.json`),
    import(`../../messages/${locale}/announcements.json`),
    import(`../../messages/${locale}/modals.json`),
    import(`../../messages/${locale}/members.json`),
    import(`../../messages/${locale}/syllabus.json`),
    import(`../../messages/${locale}/settings.json`),
    import(`../../messages/${locale}/overview.json`),
    import(`../../messages/${locale}/components.json`),
  ]);

  // Merge all translation files into one object
  return messages.reduce((acc, module) => ({
    ...acc,
    ...module.default
  }), {});
  
}

export default getRequestConfig(async () => {
  // Get locale from cookie or default to 'en'
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';

  return {
    locale,
    messages: await loadMessages(locale)
  };
});

