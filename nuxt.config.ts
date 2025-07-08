// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ["@nuxtjs/tailwindcss", "@pinia/nuxt"],
  css: ["~/assets/css/globals.css"],
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
    public: {
      baseURL: process.env.BASE_URL || "http://localhost:3000",
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
  nitro: {
    storage: {
      data: {
        driver: "fs",
        base: "./.data",
      },
    },
    compatibilityDate: "2025-07-08",
  },
});
