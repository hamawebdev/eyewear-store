import { createRequire } from "node:module";

export type ScriptPayloadClient = {
  create: (args: Record<string, unknown>) => Promise<unknown>;
  find: (args: Record<string, unknown>) => Promise<{ docs: unknown[] }>;
  getByID?: (args: Record<string, unknown>) => Promise<unknown>;
  logger: {
    info: (message: string) => void;
  };
  update: (args: Record<string, unknown>) => Promise<unknown>;
};

export const loadScriptPayloadClient = async () => {
  const require = createRequire(import.meta.url);
  const nextEnv = require("@next/env") as {
    default?: { loadEnvConfig?: (dir: string, dev?: boolean) => void };
    loadEnvConfig?: (dir: string, dev?: boolean) => void;
  };

  if (!nextEnv.default) {
    nextEnv.default = nextEnv;
  }

  nextEnv.loadEnvConfig?.(process.cwd(), true);
  nextEnv.default?.loadEnvConfig?.(process.cwd(), true);

  const [{ getPayload }, { default: configPromise }] = await Promise.all([
    import("payload"),
    import("../payload.config.js")
  ]);

  return (await getPayload({ config: configPromise })) as unknown as ScriptPayloadClient;
};
