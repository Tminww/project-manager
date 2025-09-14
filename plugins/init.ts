import { useProjectStore } from "~/stores/projects";

export default defineNuxtPlugin(async () => {
  // Этот плагин выполняется только на клиентской стороне
  if (import.meta.client) {
    const projectStore = useProjectStore();

    try {
      // Загружаем проекты из localStorage
      await projectStore.loadProjects();

      // Если настроен токен Яндекс.Диска, запускаем автосинхронизацию
      if (projectStore.getYandexToken()) {
        projectStore.startAutoSync();

        // Выполняем первоначальную синхронизацию в фоне
        projectStore.syncWithYandexDisk().catch((error) => {
          console.warn("Фоновая синхронизация при старте не удалась:", error);
        });
      }
    } catch (error) {
      console.error("Ошибка при инициализации приложения:", error);
    }
  }
});
