import { useProjectStore } from "~/stores/projects";

export default defineNuxtPlugin(async () => {
  const projectStore = useProjectStore();

  // Загружаем проекты при инициализации приложения
  try {
    await projectStore.loadProjects();
  } catch (error) {
    console.error("Ошибка при инициализации store:", error);
  }
});
