/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the API server, e.g. https://moi-api.onrender.com. Empty = same origin / Vite proxy. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
