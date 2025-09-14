import { defineStore } from "pinia";
import { ref, watch, computed } from "vue";
import type { Project } from "~/types";

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  editing?: boolean;
  editText?: string;
}

export interface YandexDiskConfig {
  token?: string;
  folderPath: string;
  fileName: string;
  syncInterval: number; // в минутах
}

export const useProjectStore = defineStore("projects", () => {
  const projects = ref<Project[]>([]);
  const selectedProject = ref<Project | null>(null);
  const lastSaved = ref<Date | null>(null);
  const lastSynced = ref<Date | null>(null);
  const isInitialized = ref(false);
  const isSyncing = ref(false);
  const syncError = ref<string | null>(null);

  // Конфигурация Яндекс.Диска
  const yandexConfig = ref<YandexDiskConfig>({
    folderPath: "/Apps/ProjectManager",
    fileName: "projects.json",
    syncInterval: 5, // синхронизация каждые 5 минут
  });

  // Ключи для localStorage
  const STORAGE_KEYS = {
    PROJECTS: "pm_projects",
    LAST_SAVED: "pm_last_saved",
    LAST_SYNCED: "pm_last_synced",
    YANDEX_TOKEN: "pm_yandex_token",
    YANDEX_CONFIG: "pm_yandex_config",
  };

  // Вычисляемые свойства
  const lastSavedFormatted = computed(() => {
    if (!lastSaved.value) return "Нет данных";
    return formatTimeAgo(lastSaved.value);
  });

  const lastSyncedFormatted = computed(() => {
    if (!lastSynced.value) return "Не синхронизировано";
    return formatTimeAgo(lastSynced.value);
  });

  const syncStatus = computed(() => {
    if (isSyncing.value) return "Синхронизация...";
    if (syncError.value) return `Ошибка: ${syncError.value}`;
    if (!lastSynced.value) return "Не синхронизировано";
    return "Синхронизировано";
  });

  // Утилиты для работы с временем
  function formatTimeAgo(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return "Только что";
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} ${minutes === 1 ? "минуту" : "минут"} назад`;
    }
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} ${hours === 1 ? "час" : "часов"} назад`;
    }
    return date.toLocaleString("ru-RU");
  }

  // Работа с localStorage
  function saveToLocalStorage() {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(
        STORAGE_KEYS.PROJECTS,
        JSON.stringify(projects.value)
      );
      localStorage.setItem(STORAGE_KEYS.LAST_SAVED, new Date().toISOString());
      lastSaved.value = new Date();
    } catch (error) {
      console.error("Ошибка при сохранении в localStorage:", error);
      throw new Error("Не удалось сохранить данные локально");
    }
  }

  function loadFromLocalStorage(): Project[] {
    if (typeof window === "undefined") return [];

    try {
      const projectsData = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      const lastSavedData = localStorage.getItem(STORAGE_KEYS.LAST_SAVED);
      const lastSyncedData = localStorage.getItem(STORAGE_KEYS.LAST_SYNCED);

      if (lastSavedData) {
        lastSaved.value = new Date(lastSavedData);
      }
      if (lastSyncedData) {
        lastSynced.value = new Date(lastSyncedData);
      }

      if (projectsData) {
        const parsed = JSON.parse(projectsData);
        return Array.isArray(parsed) ? parsed : [];
      }
      return [];
    } catch (error) {
      console.error("Ошибка при загрузке из localStorage:", error);
      return [];
    }
  }

  // Работа с Яндекс.Диском
  async function uploadToYandexDisk(data: Project[]): Promise<void> {
    const token = localStorage.getItem(STORAGE_KEYS.YANDEX_TOKEN);
    if (!token) {
      throw new Error("Токен Яндекс.Диска не настроен");
    }

    const config = yandexConfig.value;
    const fileContent = JSON.stringify(data, null, 2);

    try {
      // Создаем папку, если не существует
      await createYandexDiskFolder(token, config.folderPath);

      // Загружаем файл
      const uploadUrl = await getYandexDiskUploadUrl(
        token,
        `${config.folderPath}/${config.fileName}`
      );

      const response = await fetch(uploadUrl, {
        method: "PUT",
        body: fileContent,
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Ошибка загрузки: ${response.statusText}`);
      }

      localStorage.setItem(STORAGE_KEYS.LAST_SYNCED, new Date().toISOString());
      lastSynced.value = new Date();
      syncError.value = null;
    } catch (error) {
      console.error("Ошибка при загрузке на Яндекс.Диск:", error);
      syncError.value =
        error instanceof Error ? error.message : "Неизвестная ошибка";
      throw error;
    }
  }

  async function downloadFromYandexDisk(): Promise<Project[]> {
    const token = localStorage.getItem(STORAGE_KEYS.YANDEX_TOKEN);
    if (!token) {
      throw new Error("Токен Яндекс.Диска не настроен");
    }

    const config = yandexConfig.value;

    try {
      const downloadUrl = await getYandexDiskDownloadUrl(
        token,
        `${config.folderPath}/${config.fileName}`
      );

      const response = await fetch(downloadUrl);
      if (!response.ok) {
        if (response.status === 404) {
          // Файл не существует, возвращаем пустой массив
          return [];
        }
        throw new Error(`Ошибка скачивания: ${response.statusText}`);
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error("Некорректный формат данных в облаке");
      }

      localStorage.setItem(STORAGE_KEYS.LAST_SYNCED, new Date().toISOString());
      lastSynced.value = new Date();
      syncError.value = null;

      return data;
    } catch (error) {
      console.error("Ошибка при скачивании с Яндекс.Диска:", error);
      syncError.value =
        error instanceof Error ? error.message : "Неизвестная ошибка";
      throw error;
    }
  }

  // Вспомогательные функции для Яндекс.Диска
  async function createYandexDiskFolder(
    token: string,
    path: string
  ): Promise<void> {
    try {
      const response = await fetch(
        `https://cloud-api.yandex.net/v1/disk/resources?path=${encodeURIComponent(
          path
        )}`,
        {
          method: "PUT",
          headers: {
            Authorization: `OAuth ${token}`,
          },
        }
      );

      if (!response.ok && response.status !== 409) {
        // 409 = папка уже существует
        throw new Error(`Ошибка создания папки: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Ошибка при создании папки:", error);
      // Не прерываем выполнение, если папка не создалась
    }
  }

  async function getYandexDiskUploadUrl(
    token: string,
    path: string
  ): Promise<string> {
    const response = await fetch(
      `https://cloud-api.yandex.net/v1/disk/resources/upload?path=${encodeURIComponent(
        path
      )}&overwrite=true`,
      {
        headers: {
          Authorization: `OAuth ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Ошибка получения URL для загрузки: ${response.statusText}`
      );
    }

    const data = await response.json();
    return data.href;
  }

  async function getYandexDiskDownloadUrl(
    token: string,
    path: string
  ): Promise<string> {
    const response = await fetch(
      `https://cloud-api.yandex.net/v1/disk/resources/download?path=${encodeURIComponent(
        path
      )}`,
      {
        headers: {
          Authorization: `OAuth ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Ошибка получения URL для скачивания: ${response.statusText}`
      );
    }

    const data = await response.json();
    return data.href;
  }

  // Синхронизация
  async function syncWithYandexDisk(): Promise<void> {
    if (isSyncing.value) return;

    isSyncing.value = true;
    try {
      // Сначала пытаемся скачать данные из облака
      const cloudData = await downloadFromYandexDisk();
      console.log("Данные из облака загружены:", cloudData);

      // Сравниваем с локальными данными по времени изменения
      const localLastSaved = lastSaved.value;
      const cloudLastModified = lastSynced.value;

      // Если облачные данные новее или локальных данных нет
      if (
        !localLastSaved ||
        (cloudLastModified && cloudLastModified > localLastSaved)
      ) {
        projects.value = cloudData;
        saveToLocalStorage();
      } else {
        // Загружаем локальные данные в облако
        await uploadToYandexDisk(projects.value);
      }
    } catch (error) {
      console.error("Ошибка синхронизации:", error);
      // При ошибке синхронизации продолжаем работать с локальными данными
    } finally {
      isSyncing.value = false;
    }
  }

  // Загрузка проектов
  async function loadProjects(): Promise<Project[]> {
    try {
      // Загружаем из localStorage
      const localProjects = loadFromLocalStorage();
      projects.value = localProjects;
      isInitialized.value = true;

      // Запускаем синхронизацию в фоне, если настроен токен
      if (
        typeof window !== "undefined" &&
        localStorage.getItem(STORAGE_KEYS.YANDEX_TOKEN)
      ) {
        syncWithYandexDisk().catch((error) => {
          console.error("Фоновая синхронизация не удалась:", error);
        });
      }

      return projects.value;
    } catch (error) {
      console.error("Ошибка при загрузке проектов:", error);
      projects.value = [];
      isInitialized.value = true;
      return [];
    }
  }

  // Автосохранение
  watch(
    projects,
    async (newProjects, oldProjects) => {
      if (!isInitialized.value) return;

      if (JSON.stringify(newProjects) !== JSON.stringify(oldProjects)) {
        try {
          saveToLocalStorage();
        } catch (error) {
          console.error("Ошибка при автоматическом сохранении:", error);
        }
      }
    },
    { deep: true }
  );

  // Управление проектами
  async function createProject(project: Omit<Project, "id" | "tasks">) {
    const newProject: Project = {
      ...project,
      id: crypto.randomUUID(),
      tasks: [],
    };
    projects.value.push(newProject);
    return newProject;
  }

  async function updateProject(project: Project) {
    const index = projects.value.findIndex((p) => p.id === project.id);
    if (index !== -1) {
      projects.value[index] = project;
    }
  }

  async function deleteProject(id: string) {
    projects.value = projects.value.filter((p) => p.id !== id);
  }

  // Управление задачами
  async function addTodo(projectId: string, title: string) {
    const project = projects.value.find((p) => p.id === projectId);
    if (project) {
      project.tasks.unshift({
        id: crypto.randomUUID(),
        title,
        completed: false,
      });
    }
  }

  async function updateTodo(
    projectId: string,
    taskId: string,
    updates: Partial<Todo>
  ) {
    const project = projects.value.find((p) => p.id === projectId);
    if (project) {
      const task = project.tasks.find((t) => t.id === taskId);
      if (task) {
        Object.assign(task, updates);
      }
    }
  }

  async function deleteTodo(projectId: string, taskId: string) {
    const project = projects.value.find((p) => p.id === projectId);
    if (project) {
      project.tasks = project.tasks.filter((t) => t.id !== taskId);
    }
  }

  async function toggleTask(projectId: string, taskId: string) {
    const project = projects.value.find((p) => p.id === projectId);
    if (project) {
      const task = project.tasks.find((t) => t.id === taskId);
      if (task) {
        task.completed = !task.completed;
      }
    }
  }

  // Импорт/экспорт
  async function exportProjects(): Promise<string> {
    return JSON.stringify(projects.value, null, 2);
  }

  async function importProjects(data: Project[] | string) {
    try {
      const projectsData = typeof data === "string" ? JSON.parse(data) : data;
      if (!Array.isArray(projectsData)) {
        throw new Error("Неверный формат данных");
      }
      projects.value = projectsData;
      return true;
    } catch (error) {
      console.error("Ошибка импорта:", error);
      throw new Error("Не удалось импортировать данные");
    }
  }

  // Настройки Яндекс.Диска
  function setYandexToken(token: string) {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.YANDEX_TOKEN, token);
    }
  }

  function getYandexToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE_KEYS.YANDEX_TOKEN);
  }

  function removeYandexToken() {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEYS.YANDEX_TOKEN);
    }
  }

  // Автоматическая синхронизация
  let syncInterval: NodeJS.Timeout | null = null;

  function startAutoSync() {
    if (syncInterval || typeof window === "undefined") return;

    syncInterval = setInterval(() => {
      if (localStorage.getItem(STORAGE_KEYS.YANDEX_TOKEN)) {
        syncWithYandexDisk().catch((error) => {
          console.error("Автоматическая синхронизация не удалась:", error);
        });
      }
    }, yandexConfig.value.syncInterval * 60 * 1000);
  }

  function stopAutoSync() {
    if (syncInterval) {
      clearInterval(syncInterval);
      syncInterval = null;
    }
  }

  return {
    // Состояние
    projects,
    selectedProject,
    lastSaved,
    lastSynced,
    lastSavedFormatted,
    lastSyncedFormatted,
    syncStatus,
    isInitialized,
    isSyncing,
    syncError,
    yandexConfig,

    // Основные методы
    loadProjects,
    createProject,
    updateProject,
    deleteProject,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleTask,

    // Импорт/экспорт
    exportProjects,
    importProjects,

    // Синхронизация
    syncWithYandexDisk,
    startAutoSync,
    stopAutoSync,

    // Настройки Яндекс.Диска
    setYandexToken,
    getYandexToken,
    removeYandexToken,
  };
});
