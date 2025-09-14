<template>
  <div class="bg-white rounded-lg shadow p-4 space-y-3">
    <div class="flex items-center justify-between">
      <h4 class="text-sm font-medium text-gray-900">Статус синхронизации</h4>
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
      </div>
      <div v-if="hasToken">
        <div class="font-medium">Синхронизировано</div>
        <div>{{ projectStore.lastSyncedFormatted }}</div>
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
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useProjectStore } from "~/stores/projects";

const projectStore = useProjectStore();

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

async function manualSync() {
  if (!hasToken.value) {
    alert("Сначала настройте токен Яндекс.Диска");
    return;
  }

  try {
    await projectStore.syncWithYandexDisk();
  } catch (error) {
    console.error("Ошибка синхронизации:", error);
  }
}
</script>
