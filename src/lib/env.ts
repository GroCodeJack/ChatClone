const REQUIRED_ENV_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SECRET_KEY",
] as const;

type EnvKey = (typeof REQUIRED_ENV_VARS)[number];

type EnvMap = Record<EnvKey, string>;

function readEnv(): EnvMap {
  const entries = REQUIRED_ENV_VARS.map((key) => {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return [key, value] as const;
  });

  return Object.fromEntries(entries) as EnvMap;
}

export const env = readEnv();
