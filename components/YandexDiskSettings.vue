<template>
  <div class="space-y-6">
    <div>
      <h3 class="text-lg font-medium leading-6 text-gray-900 mb-4">
        Синхронизация с Яндекс.Диском
      </h3>

      <!-- Статус синхронизации -->
      <div class="mb-4 p-3 rounded-md" :class="statusClasses">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <svg
              v-if="projectStore.isSyncing"
              class="animate-spin h-5 w-5"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path
                d="M12 2v4m0 12v4m10-10h-4M6 12H2m15.364-7.364l-2.828 2.828M8.464 8.464L5.636 5.636m12.728 12.728l-2.828-2.828M8.464 15.536l-2.828 2.828"
              />
            </svg>
            <svg
              v-else-if="projectStore.syncError"
              class="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd"
              />
            </svg>
            <svg
              v-else-if="hasToken && projectStore.lastSynced"
              class="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
            </svg>
            <svg v-else class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium">{{ projectStore.syncStatus }}</p>
            <p v-if="projectStore.lastSynced" class="text-xs">
              Последняя синхронизация: {{ projectStore.lastSyncedFormatted }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Настройка токена -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Токен доступа
      </label>
      <div class="flex gap-2">
        <input
          v-model="tokenInput"
          :type="showToken ? 'text' : 'password'"
          class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder="Вставьте токен OAuth"
        />
        <Button variant="secondary" size="sm" @click="showToken = !showToken">
          {{ showToken ? "Скрыть" : "Показать" }}
        </Button>
      </div>
      <p class="mt-1 text-xs text-gray-500">
        <a
          :href="generateOAuthUrl()"
          target="_blank"
          class="text-indigo-600 hover:text-indigo-500"
        >
          Получить токен на Yandex OAuth
        </a>
      </p>
    </div>

    <!-- Настройки синхронизации -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Интервал автосинхронизации (минуты)
      </label>
      <select
        v-model="syncInterval"
        class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
      >
        <option :value="1">1 минута</option>
        <option :value="5">5 минут</option>
        <option :value="10">10 минут</option>
        <option :value="30">30 минут</option>
        <option :value="60">1 час</option>
      </select>
    </div>

    <!-- Путь к папке -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Папка на Яндекс.Диске
      </label>
      <input
        v-model="folderPath"
        type="text"
        class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        placeholder="/Apps/ProjectManager"
      />
    </div>

    <!-- Имя файла -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Имя файла
      </label>
      <input
        v-model="fileName"
        type="text"
        class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        placeholder="projects.json"
      />
    </div>

    <!-- Кнопки управления -->
    <div class="flex gap-2 flex-wrap">
      <Button
        variant="primary"
        @click="saveSettings"
        :disabled="!tokenInput.trim()"
      >
        Сохранить настройки
      </Button>

      <Button
        variant="secondary"
        @click="manualSync"
        :disabled="!hasToken || projectStore.isSyncing"
      >
        {{
          projectStore.isSyncing
            ? "Синхронизация..."
            : "Синхронизировать сейчас"
        }}
      </Button>

      <Button v-if="hasToken" variant="danger" @click="disconnectYandexDisk">
        Отключить
      </Button>
    </div>

    <!-- Информация о синхронизации -->
    <div class="bg-gray-50 p-4 rounded-md">
      <h4 class="text-sm font-medium text-gray-900 mb-2">
        Как работает синхронизация
      </h4>
      <ul class="text-xs text-gray-600 space-y-1">
        <li>
          • Данные автоматически сохраняются в браузере при каждом изменении
        </li>
        <li>
          • Синхронизация с облаком происходит автоматически через заданные
          интервалы
        </li>
        <li>• При конфликтах приоритет отдается более свежим данным</li>
        <li>• Даже без интернета приложение работает с локальными данными</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useProjectStore } from "~/stores/projects";

const projectStore = useProjectStore();

// Локальное состояние формы
const tokenInput = ref("");
const showToken = ref(false);
const syncInterval = ref(5);
const folderPath = ref("/Apps/ProjectManager");
const fileName = ref("projects.json");

const config = useRuntimeConfig();
// Вычисляемые свойства
const hasToken = computed(() => !!projectStore.getYandexToken());

const statusClasses = computed(() => {
  if (projectStore.isSyncing) {
    return "bg-blue-50 text-blue-700";
  }
  if (projectStore.syncError) {
    return "bg-red-50 text-red-700";
  }
  if (hasToken.value && projectStore.lastSynced) {
    return "bg-green-50 text-green-700";
  }
  return "bg-yellow-50 text-yellow-700";
});

// Методы
function generateOAuthUrl(): string {
  return `${config.public.yandexOAuthUrl}?response_type=token&client_id=${config.public.yandexClientId}&redirect_uri=https://oauth.yandex.ru/verification_code`;
}

function saveSettings() {
  if (!tokenInput.value.trim()) {
    alert("Введите токен доступа");
    return;
  }

  // Сохраняем токен
  projectStore.setYandexToken(tokenInput.value.trim());

  // Обновляем конфигурацию
  projectStore.yandexConfig.syncInterval = syncInterval.value;
  projectStore.yandexConfig.folderPath = folderPath.value;
  projectStore.yandexConfig.fileName = fileName.value;

  // Запускаем автосинхронизацию
  projectStore.stopAutoSync();
  projectStore.startAutoSync();

  // Выполняем первую синхронизацию
  manualSync();

  alert("Настройки сохранены! Автосинхронизация запущена.");
}

async function manualSync() {
  try {
    await projectStore.syncWithYandexDisk();
    if (!projectStore.syncError) {
      alert("Синхронизация успешно завершена!");
    }
  } catch (error) {
    alert(
      `Ошибка синхронизации: ${
        error instanceof Error ? error.message : "Неизвестная ошибка"
      }`
    );
  }
}

function disconnectYandexDisk() {
  if (
    confirm(
      "Отключить синхронизацию с Яндекс.Диском? Локальные данные останутся."
    )
  ) {
    projectStore.removeYandexToken();
    projectStore.stopAutoSync();
    tokenInput.value = "";
    alert("Синхронизация отключена");
  }
}

// Инициализация
onMounted(() => {
  // Загружаем текущие настройки
  const currentToken = projectStore.getYandexToken();
  if (currentToken) {
    tokenInput.value = currentToken;
    // Запускаем автосинхронизацию если токен уже есть
    projectStore.startAutoSync();
  }

  // Загружаем конфигурацию
  syncInterval.value = projectStore.yandexConfig.syncInterval;
  folderPath.value = projectStore.yandexConfig.folderPath;
  fileName.value = projectStore.yandexConfig.fileName;
});
</script>
