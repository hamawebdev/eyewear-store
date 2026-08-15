import type React from "react";
import { initI18n } from "@payloadcms/translations";
import { handleServerFunctions } from "@payloadcms/next/layouts";
import "@payloadcms/next/css";
import { ProgressBar, RootProvider } from "@payloadcms/ui";
import {
  createClientConfig,
  createLocalReq,
  createUnauthenticatedClientConfig,
  executeAuthStrategies,
  getAccessResults,
  getPayload,
  getRequestLanguage,
  parseCookies,
  type LanguageOptions,
  type ServerFunctionClientArgs
} from "payload";
import { applyLocaleFiltering } from "payload/shared";
import { headers } from "next/headers";
import configPromise from "@payload-config";
import { importMap } from "./importMap";

const theme = "light" as const;

const buildLanguageOptions = (
  supportedLanguages: Record<string, { translations: { general: { thisLanguage: string } } }>
) =>
  Object.entries(supportedLanguages).map(([value, languageConfig]) => ({
    label: languageConfig.translations.general.thisLanguage,
    value
  })) as LanguageOptions;

export default async function PayloadAdminLayout({ children }: { children: React.ReactNode }) {
  const requestHeaders = await headers();
  const payload = await getPayload({
    config: configPromise,
    cron: true,
    importMap
  });
  const cookies = parseCookies(requestHeaders);
  const languageCode = getRequestLanguage({
    config: payload.config,
    cookies,
    headers: requestHeaders
  });
  const i18n = await initI18n({
    config: payload.config.i18n,
    context: "client",
    language: languageCode
  });
  const { responseHeaders, user } = await executeAuthStrategies({
    headers: requestHeaders,
    payload
  });
  const req = await createLocalReq(
    {
      req: {
        headers: requestHeaders,
        host: requestHeaders.get("host") || undefined,
        i18n,
        responseHeaders,
        user
      }
    },
    payload
  );
  const permissions = await getAccessResults({ req });
  const authenticatedClientConfig = createClientConfig({
    config: payload.config,
    i18n,
    importMap,
    user: user ?? true
  });
  const clientConfig = (
    user
      ? authenticatedClientConfig
      : createUnauthenticatedClientConfig({ clientConfig: authenticatedClientConfig })
  ) as typeof authenticatedClientConfig;

  await applyLocaleFiltering({
    clientConfig,
    config: payload.config,
    req
  });

  async function serverFunction(args: ServerFunctionClientArgs) {
    "use server";

    return handleServerFunctions({
      ...args,
      config: configPromise,
      importMap
    });
  }

  return (
    <>
      <RootProvider
        config={clientConfig}
        dateFNSKey={i18n.dateFNSKey}
        fallbackLang={payload.config.i18n.fallbackLanguage}
        isNavOpen
        languageCode={languageCode}
        languageOptions={buildLanguageOptions(payload.config.i18n.supportedLanguages || {})}
        locale={req.locale || undefined}
        permissions={permissions}
        serverFunction={serverFunction}
        theme={theme}
        translations={i18n.translations}
        user={user}
      >
        <ProgressBar />
        {children}
      </RootProvider>
      <div id="portal" />
    </>
  );
}
