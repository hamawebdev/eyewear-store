"use client";

import { ReactSelect, useTranslation } from "@payloadcms/ui";
import { ADMIN_LANGUAGES, type AdminLanguage } from "@/lib/admin-i18n";

type LanguageOption = {
  label: string;
  value: AdminLanguage;
};

// Each language is named in itself, the way Payload labels them on the account
// page (`general:thisLanguage`), so either option is readable whichever language
// the admin is currently in.
const LANGUAGE_LABELS: Record<AdminLanguage, string> = {
  en: "English",
  fr: "Français"
};

const OPTIONS: LanguageOption[] = ADMIN_LANGUAGES.map((value) => ({
  label: LANGUAGE_LABELS[value],
  value
}));

/**
 * Language picker for the admin header.
 *
 * Payload only ships one language control, buried in `/admin/account`, which is
 * easy to miss. This mirrors it into `admin.components.actions` so it sits in the
 * top-right of every admin view.
 *
 * `switchLanguage` comes from Payload's own translation provider: it persists the
 * choice through the `switchLanguageServerAction` wired up in the admin layout and
 * then refreshes the route so the server re-renders in the new language.
 */
export default function AdminLanguageSwitcher() {
  const { i18n, switchLanguage } = useTranslation();

  const current = OPTIONS.find((option) => option.value === i18n.language);

  return (
    <div className="admin-language-switcher" style={{ minWidth: "9rem" }}>
      <ReactSelect
        inputId="admin-language-switcher"
        isClearable={false}
        isSearchable={false}
        onChange={(option: unknown) => {
          const next = (Array.isArray(option) ? option[0] : option) as
            | LanguageOption
            | null
            | undefined;

          if (!next || next.value === i18n.language) {
            return;
          }

          void switchLanguage?.(next.value);
        }}
        options={OPTIONS}
        value={current}
      />
    </div>
  );
}
