<template>
  <div class="bg-white rounded-lg shadow p-4 space-y-3">
    <div class="flex items-center justify-between">
      <h4 class="text-sm font-medium text-gray-900">Статус синхронизации</h4>
      <div class="flex items-center gap-2">
        <!-- ID устройства -->
        <div
          class="text-xs text-gray-400 font-mono"
          :title="`ID устройства: ${projectStore.deviceId}`"
        >
          {{ projectStore.deviceId.slice(0, 8) }}
        </div>
        <Button
          variant="ghost"
          size="sm"
          @click="manualSync"
          :disabled="projectStore.isSyncing"
        >
          <svg
            class="w-4 h-4"
            :class="{ 'animate-spin': projectStore.isSyncing }"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path d="M23 4v6h-6M1 20v-6h6m2-4a8 8 0 0114 0M7 16a8 8 0 0014 0" />
          </svg>
        </Button>
      </div>
    </div>

    <!-- Основной статус -->
    <div class="flex items-center space-x-2">
      <div class="flex-shrink-0">
        <div
          class="w-2 h-2 rounded-full"
          :class="{
            'bg-blue-500 animate-pulse': projectStore.isSyncing,
            'bg-red-500': projectStore.syncError,
            'bg-green-500':
              !projectStore.syncError && hasToken && projectStore.lastSynced,
            'bg-yellow-500':
              !projectStore.syncError && hasToken && !projectStore.lastSynced,
            'bg-gray-400': !hasToken,
          }"
        />
      </div>
      <span class="text-sm text-gray-600">
        {{ statusText }}
      </span>
    </div>

    <!-- Детальная информация -->
    <div class="grid grid-cols-2 gap-4 text-xs text-gray-500">
      <div>
        <div class="font-medium">Локально сохранено</div>
        <div>{{ projectStore.lastSavedFormatted }}</div>
        <div v-if="localVersion" class="text-gray-400">
          версия {{ localVersion }}
        </div>
      </div>
      <div v-if="hasToken">
        <div class="font-medium">Синхронизировано</div>
        <div>{{ projectStore.lastSyncedFormatted }}</div>
        <div v-if="cloudVersion" class="text-gray-400">
          облачная версия {{ cloudVersion }}
        </div>
      </div>
    </div>

    <!-- Прогресс синхронизации -->
    <div
      v-if="projectStore.isSyncing"
      class="bg-blue-50 border border-blue-200 rounded-md p-3"
    >
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <svg
            class="animate-spin h-4 w-4 text-blue-500"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path
              d="M12 2v4m0 12v4m10-10h-4M6 12H2m15.364-7.364l-2.828 2.828M8.464 8.464L5.636 5.636m12.728 12.728l-2.828-2.828M8.464 15.536l-2.828 2.828"
            />
          </svg>
        </div>
        <div class="ml-2">
          <p class="text-xs text-blue-700">
            Выполняется синхронизация данных...
          </p>
        </div>
      </div>
    </div>

    <!-- Ошибка синхронизации -->
    <div
      v-if="projectStore.syncError"
      class="bg-red-50 border border-red-200 rounded-md p-3"
    >
      <div class="flex">
        <div class="flex-shrink-0">
          <svg
            class="h-4 w-4 text-red-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
        <div class="ml-2">
          <p class="text-xs text-red-700">{{ projectStore.syncError }}</p>
        </div>
      </div>
    </div>

    <!-- Успешная синхронизация -->
    <div
      v-if="
        !projectStore.isSyncing &&
        !projectStore.syncError &&
        hasToken &&
        projectStore.lastSynced
      "
      class="bg-green-50 border border-green-200 rounded-md p-3"
    >
      <div class="flex">
        <div class="flex-shrink-0">
          <svg
            class="h-4 w-4 text-green-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
        <div class="ml-2">
          <p class="text-xs text-green-700">Данные успешно синхронизированы</p>
          <p v-if="syncDetails" class="text-xs text-green-600 mt-1">
            {{ syncDetails }}
          </p>
        </div>
      </div>
    </div>

    <!-- Информация о настройке -->
    <div
      v-if="!hasToken"
      class="bg-yellow-50 border border-yellow-200 rounded-md p-3"
    >
      <div class="flex">
        <div class="flex-shrink-0">
          <svg
            class="h-4 w-4 text-yellow-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
        <div class="ml-2">
          <p class="text-xs text-yellow-700">
            Настройте токен Яндекс.Диска для синхронизации данных между
            устройствами
          </p>
        </div>
      </div>
    </div>

    <!-- Детали конфликтов -->
    <div
      v-if="conflictInfo"
      class="bg-orange-50 border border-orange-200 rounded-md p-3"
    >
      <div class="flex">
        <div class="flex-shrink-0">
          <svg
            class="h-4 w-4 text-orange-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
        <div class="ml-2">
          <p class="text-xs text-orange-700 font-medium">
            Обнаружен конфликт версий
          </p>
          <p class="text-xs text-orange-600 mt-1">{{ conflictInfo }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useProjectStore } from "~/stores/projects";

const projectStore = useProjectStore();

// Дополнительная информация для отображения
const localVersion = ref<number | null>(null);
const cloudVersion = ref<number | null>(null);
const syncDetails = ref<string>("");
const conflictInfo = ref<string>("");

const hasToken = computed(() => !!projectStore.getYandexToken());

const statusText = computed(() => {
  if (projectStore.isSyncing) {
    return "Синхронизация...";
  }

  if (projectStore.syncError) {
    return "Ошибка синхронизации";
  }

  if (!hasToken.value) {
    return "Синхронизация не настроена";
  }

  if (!projectStore.lastSynced) {
    return "Ожидание синхронизации";
  }

  return "Синхронизировано";
});

// Отслеживание изменений для получения дополнительной информации
watch(
  [() => projectStore.lastSynced, () => projectStore.syncError],
  async () => {
    if (typeof window === "undefined") return;

    try {
      // Получаем локальную версию
      const localData = localStorage.getItem("pm_projects");
      if (localData) {
        const parsed = JSON.parse(localData);
        if (parsed.version) {
          localVersion.value = parsed.version;
        }
      }

      // Получаем версию из localStorage для отображения
      const versionData = localStorage.getItem("pm_version");
      if (versionData) {
        localVersion.value = parseInt(versionData);
      }
    } catch (error) {
      console.error("Ошибка получения информации о версии:", error);
    }

    // Очищаем детали при новой операции
    if (projectStore.isSyncing) {
      syncDetails.value = "";
      conflictInfo.value = "";
    }
  },
  { immediate: true }
);

async function manualSync() {
  if (!hasToken.value) {
    alert("Сначала настройте токен Яндекс.Диска");
    return;
  }

  try {
    syncDetails.value = "Начинается ручная синхронизация...";
    await projectStore.syncWithYandexDisk();

    if (!projectStore.syncError) {
      syncDetails.value = "Ручная синхронизация завершена успешно";
      conflictInfo.value = "";
    }
  } catch (error) {
    console.error("Ошибка синхронизации:", error);
    syncDetails.value = "";

    // Анализируем тип ошибки для более детального отображения
    if (error instanceof Error) {
      if (error.message.includes("конфликт")) {
        conflictInfo.value = error.message;
      }
    }
  }
}

// Дополнительная функция для получения расширенной информации о синхронизации
function getSyncInfo() {
  if (typeof window === "undefined") return;

  try {
    const projects = localStorage.getItem("pm_projects");
    if (projects) {
      const data = JSON.parse(projects);
      if (data.version && data.deviceId) {
        localVersion.value = data.version;
        if (data.deviceId !== projectStore.deviceId) {
          conflictInfo.value = `Данные созданы на другом устройстве (${data.deviceId.slice(
            0,
            8
          )})`;
        }
      }
    }
  } catch (error) {
    console.error("Ошибка получения информации о синхронизации:", error);
  }
}

// Инициализируем информацию при монтировании
onMounted(() => {
  getSyncInfo();
});
</script>
