// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ["@nuxtjs/tailwindcss", "@pinia/nuxt"],
  css: ["~/assets/css/globals.css"],

  // Настройки для статической генерации
  ssr: true,
  nitro: {
    prerender: {
      routes: ["/"],
    },
  },

  app: {
    head: {
      title: "Project Manager",
      titleTemplate: "%s | Project Manager",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          name: "description",
          content:
            "Современный менеджер проектов для эффективного управления задачами и проектами",
        },
      ],
      link: [
        {
          rel: "icon",
          type: "image/svg+xml",
          href: "/favicon.ico",
          sizes: "any",
        },
        { rel: "mask-icon", href: "/favicon.ico", color: "#2563EB" },
        { rel: "shortcut icon", href: "/favicon.ico" },
      ],
    },
  },

  runtimeConfig: {
    // Приватные переменные (доступны только на сервере)
    // В данном случае у нас нет серверной логики, но можно добавить при необходимости

    // Публичные переменные (доступны на клиенте)
    public: {
      baseURL: process.env.NUXT_PUBLIC_BASE_URL || "",
      yandexClientId:
        process.env.NUXT_PUBLIC_YANDEX_CLIENT_ID ||
        "c7e4f7f3e2b54b84a53ac2e6b9a2c39b",
      yandexOAuthUrl:
        process.env.NUXT_PUBLIC_YANDEX_OAUTH_URL ||
        "https://oauth.yandex.ru/authorize",
      yandexApiBase:
        process.env.NUXT_PUBLIC_YANDEX_API_BASE ||
        "https://cloud-api.yandex.net/v1/disk",
      defaultSyncInterval:
        Number(process.env.NUXT_PUBLIC_DEFAULT_SYNC_INTERVAL) || 5,
      defaultFolderPath:
        process.env.NUXT_PUBLIC_DEFAULT_FOLDER_PATH || "/Apps/ProjectManager",
      defaultFileName:
        process.env.NUXT_PUBLIC_DEFAULT_FILE_NAME || "projects.json",
      appName: process.env.NUXT_PUBLIC_APP_NAME || "Project Manager",
      appVersion: process.env.NUXT_PUBLIC_APP_VERSION || "1.0.0",
      maxProjects: Number(process.env.NUXT_PUBLIC_MAX_PROJECTS) || 100,
      maxTasksPerProject:
        Number(process.env.NUXT_PUBLIC_MAX_TASKS_PER_PROJECT) || 50,
      debugSync: process.env.NUXT_PUBLIC_DEBUG_SYNC === "true",
      debugStorage: process.env.NUXT_PUBLIC_DEBUG_STORAGE === "true",
    },
  },

  tailwindcss: {
    config: {
      darkMode: "class",
      content: [
        "./components/**/*.{js,vue,ts}",
        "./layouts/**/*.vue",
        "./pages/**/*.vue",
        "./plugins/**/*.{js,ts}",
        "./app.vue",
        "./error.vue",
      ],
    },
  },

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  compatibilityDate: "2025-01-08",
});
