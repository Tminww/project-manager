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
  syncInterval: number;
}

// Метаданные для синхронизации
export interface SyncMetadata {
  version: number;
  lastModified: string;
  deviceId: string;
  checksum: string;
  projects: Project[];
}

export const useProjectStore = defineStore("projects", () => {
  const projects = ref<Project[]>([]);
  const selectedProject = ref<Project | null>(null);
  const lastSaved = ref<Date | null>(null);
  const lastSynced = ref<Date | null>(null);
  const isInitialized = ref(false);
  const isSyncing = ref(false);
  const syncError = ref<string | null>(null);
  const deviceId = ref<string>("");

  // Конфигурация Яндекс.Диска
  const yandexConfig = ref<YandexDiskConfig>({
    folderPath: "/Apps/ProjectManager",
    fileName: "projects.json",
    syncInterval: 5,
  });

  // Ключи для localStorage
  const STORAGE_KEYS = {
    PROJECTS: "pm_projects",
    LAST_SAVED: "pm_last_saved",
    LAST_SYNCED: "pm_last_synced",
    YANDEX_TOKEN: "pm_yandex_token",
    YANDEX_CONFIG: "pm_yandex_config",
    DEVICE_ID: "pm_device_id",
    VERSION: "pm_version",
  };

  // Инициализация ID устройства
  function initDeviceId() {
    if (typeof window === "undefined") return;

    let id = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(STORAGE_KEYS.DEVICE_ID, id);
    }
    deviceId.value = id;
  }

  // Вычисление контрольной суммы
  function calculateChecksum(data: Project[]): string {
    // Сортируем проекты и их задачи для стабильной контрольной суммы
    const sortedData = data
      .slice()
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((project) => ({
        ...project,
        tasks: project.tasks.slice().sort((a, b) => a.id.localeCompare(b.id)),
      }));

    const sortedString = JSON.stringify(sortedData);

    // Используем простой хеш-алгоритм для Unicode-строк
    let hash = 0;
    for (let i = 0; i < sortedString.length; i++) {
      const char = sortedString.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Преобразуем в 32-битное число
    }

    // Возвращаем положительное число в виде строки
    return Math.abs(hash).toString(16).padStart(8, "0").slice(0, 8);
  }

  // Получение версии данных
  function getCurrentVersion(): number {
    if (typeof window === "undefined") return 1;
    const version = localStorage.getItem(STORAGE_KEYS.VERSION);
    return version ? parseInt(version) : 1;
  }

  // Увеличение версии данных
  function incrementVersion(): number {
    const newVersion = getCurrentVersion() + 1;
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.VERSION, newVersion.toString());
    }
    return newVersion;
  }

  // Установка версии без увеличения
  function setVersion(version: number): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.VERSION, version.toString());
    }
  }

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

  // Создание метаданных
  function createSyncMetadata(projectsData: Project[]): SyncMetadata {
    return {
      version: getCurrentVersion(),
      lastModified: new Date().toISOString(),
      deviceId: deviceId.value,
      checksum: calculateChecksum(projectsData),
      projects: projectsData,
    };
  }

  // Работа с localStorage
  function saveToLocalStorage() {
    if (typeof window === "undefined") return;

    try {
      const version = incrementVersion();
      const metadata = createSyncMetadata(projects.value);

      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(metadata));
      localStorage.setItem(STORAGE_KEYS.LAST_SAVED, new Date().toISOString());
      lastSaved.value = new Date();

      console.log(`Данные сохранены в localStorage, версия: ${version}`);
    } catch (error) {
      console.error("Ошибка при сохранении в localStorage:", error);
      throw new Error("Не удалось сохранить данные локально");
    }
  }

  function loadFromLocalStorage(): {
    projects: Project[];
    metadata?: SyncMetadata;
  } {
    if (typeof window === "undefined") return { projects: [] };

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

        // Проверяем, есть ли метаданные (новый формат)
        if (parsed.version && parsed.projects) {
          return {
            projects: Array.isArray(parsed.projects) ? parsed.projects : [],
            metadata: parsed as SyncMetadata,
          };
        }

        // Старый формат - просто массив проектов
        if (Array.isArray(parsed)) {
          return { projects: parsed };
        }
      }
      return { projects: [] };
    } catch (error) {
      console.error("Ошибка при загрузке из localStorage:", error);
      return { projects: [] };
    }
  }

  // Работа с Яндекс.Диском
  async function uploadToYandexDisk(data: Project[]): Promise<void> {
    const token = localStorage.getItem(STORAGE_KEYS.YANDEX_TOKEN);
    if (!token) {
      throw new Error("Токен Яндекс.Диска не настроен");
    }

    const config = yandexConfig.value;
    const metadata = createSyncMetadata(data);
    const fileContent = JSON.stringify(metadata, null, 2);

    try {
      await createYandexDiskFolder(token, config.folderPath);

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

      console.log(`Данные загружены в облако, версия: ${metadata.version}`);
    } catch (error) {
      console.error("Ошибка при загрузке на Яндекс.Диск:", error);
      syncError.value =
        error instanceof Error ? error.message : "Неизвестная ошибка";
      throw error;
    }
  }

  async function downloadFromYandexDisk(): Promise<SyncMetadata | null> {
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
          return null; // Файл не существует
        }
        throw new Error(`Ошибка скачивания: ${response.statusText}`);
      }

      const data = await response.json();

      // Проверяем формат данных
      if (data.version && data.projects && Array.isArray(data.projects)) {
        // Новый формат с метаданными
        localStorage.setItem(
          STORAGE_KEYS.LAST_SYNCED,
          new Date().toISOString()
        );
        lastSynced.value = new Date();
        syncError.value = null;

        console.log(`Данные скачаны из облака, версия: ${data.version}`);
        return data as SyncMetadata;
      } else if (Array.isArray(data)) {
        // Старый формат - просто массив проектов
        const metadata: SyncMetadata = {
          version: 1,
          lastModified: new Date().toISOString(),
          deviceId: "unknown",
          checksum: calculateChecksum(data),
          projects: data,
        };

        console.log("Конвертированы данные старого формата");
        return metadata;
      } else {
        throw new Error("Некорректный формат данных в облаке");
      }
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
        throw new Error(`Ошибка создания папки: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Ошибка при создании папки:", error);
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

  // Улучшенная синхронизация с разрешением конфликтов
  async function syncWithYandexDisk(): Promise<void> {
    if (isSyncing.value) return;

    isSyncing.value = true;
    try {
      console.log("Начинаем синхронизацию...");

      // Загружаем данные из облака
      const cloudMetadata = await downloadFromYandexDisk();

      // Получаем локальные данные
      const { projects: localProjects, metadata: localMetadata } =
        loadFromLocalStorage();

      if (!cloudMetadata) {
        // Файла в облаке нет - загружаем локальные данные
        console.log("Файл в облаке отсутствует, загружаем локальные данные");
        await uploadToYandexDisk(projects.value);
        return;
      }

      // Сравниваем метаданные для принятия решения
      const shouldUseCloud = resolveSyncConflict(localMetadata, cloudMetadata);

      if (shouldUseCloud) {
        console.log("Применяем данные из облака");

        // Важно: сначала устанавливаем версию из облака
        setVersion(cloudMetadata.version);

        // Затем обновляем проекты
        projects.value = cloudMetadata.projects;

        // Обновляем локальное хранилище с данными из облака
        if (typeof window !== "undefined") {
          const updatedMetadata = {
            ...cloudMetadata,
            lastModified: new Date().toISOString(),
          };
          localStorage.setItem(
            STORAGE_KEYS.PROJECTS,
            JSON.stringify(updatedMetadata)
          );
          localStorage.setItem(
            STORAGE_KEYS.LAST_SAVED,
            new Date().toISOString()
          );
          lastSaved.value = new Date();
        }
      } else {
        console.log("Загружаем локальные данные в облако");
        await uploadToYandexDisk(projects.value);
      }

      console.log("Синхронизация завершена успешно");
    } catch (error) {
      console.error("Ошибка синхронизации:", error);
    } finally {
      isSyncing.value = false;
    }
  }

  // Разрешение конфликтов синхронизации
  function resolveSyncConflict(
    local: SyncMetadata | undefined,
    cloud: SyncMetadata
  ): boolean {
    // Если локальных метаданных нет, используем облачные
    if (!local) {
      console.log("Локальные метаданные отсутствуют, используем облако");
      return true;
    }

    // Сравниваем версии
    if (cloud.version > local.version) {
      console.log(
        `Облачная версия новее (${cloud.version} > ${local.version})`
      );
      return true;
    }

    if (local.version > cloud.version) {
      console.log(
        `Локальная версия новее (${local.version} > ${cloud.version})`
      );
      return false;
    }

    // Версии одинаковые, сравниваем время изменения
    const localTime = new Date(local.lastModified).getTime();
    const cloudTime = new Date(cloud.lastModified).getTime();

    // Добавляем небольшую задержку (1 секунда) для учета возможных неточностей времени
    const timeDiff = Math.abs(cloudTime - localTime);

    if (timeDiff > 1000) {
      // Если разница больше секунды
      if (cloudTime > localTime) {
        console.log("Облачные данные изменены позже");
        return true;
      }

      if (localTime > cloudTime) {
        console.log("Локальные данные изменены позже");
        return false;
      }
    }

    // Время примерно одинаковое, сравниваем контрольные суммы
    if (local.checksum !== cloud.checksum) {
      console.log(
        "Контрольные суммы не совпадают, используем устройство с меньшим ID для детерминированного выбора"
      );
      return cloud.deviceId < local.deviceId;
    }

    // Данные идентичны
    console.log("Данные идентичны, синхронизация не требуется");
    return false;
  }

  // Загрузка проектов
  async function loadProjects(): Promise<Project[]> {
    try {
      // Инициализируем ID устройства
      initDeviceId();

      // Загружаем из localStorage
      const { projects: localProjects } = loadFromLocalStorage();
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
    const metadata = createSyncMetadata(projects.value);
    return JSON.stringify(metadata, null, 2);
  }

  async function importProjects(data: Project[] | string | SyncMetadata) {
    try {
      let projectsData: Project[];

      if (typeof data === "string") {
        const parsed = JSON.parse(data);
        if (parsed.projects && Array.isArray(parsed.projects)) {
          projectsData = parsed.projects;
        } else if (Array.isArray(parsed)) {
          projectsData = parsed;
        } else {
          throw new Error("Неверный формат данных");
        }
      } else if (Array.isArray(data)) {
        projectsData = data;
      } else if (data.projects && Array.isArray(data.projects)) {
        projectsData = data.projects;
      } else {
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
    deviceId,

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
