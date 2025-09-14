<template>
  <div class="h-screen flex flex-col">
    <header class="bg-white shadow shrink-0">
      <div class="w-full px-4 py-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between">
          <h1
            class="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-4"
          >
            <img src="/favicon.ico" alt="Project Manager" class="w-10 h-10" />
            Менеджер проектов
          </h1>
          <div class="flex items-center gap-4">
            <!-- Статус синхронизации -->
            <div class="flex items-center gap-2 text-sm">
              <div class="flex items-center gap-1 text-gray-500">
                <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9.5 9.293 8.207a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4a1 1 0 00-1.414-1.414L11 9.793z"
                    clip-rule="evenodd"
                  />
                </svg>
                {{ projectStore.lastSavedFormatted }}
              </div>
              <div
                class="flex items-center gap-1"
                :class="{
                  'text-blue-600': projectStore.isSyncing,
                  'text-red-600': projectStore.syncError,
                  'text-green-600':
                    !projectStore.syncError && projectStore.lastSynced,
                  'text-yellow-600':
                    !projectStore.syncError && !projectStore.lastSynced,
                }"
              >
                <svg
                  v-if="projectStore.isSyncing"
                  class="w-4 h-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M12 2v4m0 12v4m10-10h-4M6 12H2m15.364-7.364l-2.828 2.828M8.464 8.464L5.636 5.636m12.728 12.728l-2.828-2.828M8.464 15.536l-2.828 2.828"
                  />
                </svg>
                <svg
                  v-else
                  class="w-4 h-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"
                  />
                </svg>
                {{ projectStore.lastSyncedFormatted }}
              </div>
            </div>

            <!-- Кнопки управления -->
            <Button
              variant="secondary"
              size="sm"
              @click="showSyncSettings = true"
              :class="{
                'ring-2 ring-red-300': projectStore.syncError,
                'ring-2 ring-green-300':
                  !projectStore.syncError && projectStore.lastSynced,
              }"
            >
              <svg class="w-4 h-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fill-rule="evenodd"
                  d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                  clip-rule="evenodd"
                />
              </svg>
              Синхронизация
            </Button>

            <Button variant="secondary" size="sm" @click="exportProjects">
              <svg class="w-4 h-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fill-rule="evenodd"
                  d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                  clip-rule="evenodd"
                />
              </svg>
              Экспорт
            </Button>

            <Button variant="secondary" size="sm" @click="importProjects">
              <svg class="w-4 h-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fill-rule="evenodd"
                  d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 11-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
              Импорт
            </Button>

            <Button variant="primary" @click="openProjectModal()">
              <svg class="w-4 h-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fill-rule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clip-rule="evenodd"
                />
              </svg>
              Новый проект
            </Button>
          </div>
        </div>
      </div>
    </header>

    <main class="flex-1 flex overflow-hidden">
      <!-- Левая колонка с проектами -->
      <div class="flex-1 overflow-y-auto p-6">
        <!-- Состояние загрузки -->
        <div v-if="isLoading" class="flex justify-center items-center py-12">
          <div
            class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"
          ></div>
        </div>

        <!-- Ошибка -->
        <div
          v-else-if="error"
          class="bg-red-50 border border-red-200 rounded-md p-4 my-4"
        >
          <div class="flex">
            <div class="flex-shrink-0">
              <svg
                class="h-5 w-5 text-red-400"
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
            <div class="ml-3">
              <p class="text-sm text-red-700">{{ error }}</p>
            </div>
          </div>
        </div>

        <!-- Список проектов -->
        <ClientOnly>
          <div
            v-if="!isLoading && !error"
            class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            <template v-if="projectStore.projects.length > 0">
              <ProjectCard
                v-for="project in projectStore.projects"
                :key="project.id"
                :project="project"
                @edit="openProjectModal"
                @delete="deleteProject"
                @view-details="showProjectDetails"
              />
            </template>
            <div v-else class="col-span-full text-center py-12 text-gray-500">
              <div
                class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4"
              >
                <svg
                  class="h-6 w-6 text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <p class="text-lg font-medium">Нет проектов</p>
              <p class="text-sm text-gray-500 mt-1">
                Создайте новый проект, нажав кнопку "Новый проект"
              </p>
            </div>
          </div>
        </ClientOnly>
      </div>

      <!-- Правая колонка с задачами -->
      <div
        class="w-[480px] shrink-0 bg-gray-50 border-l border-gray-200 overflow-y-auto"
      >
        <div v-if="selectedProject" class="p-6 space-y-6">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-semibold text-gray-900">
                {{ selectedProject.name }}
              </h3>
              <div class="flex gap-2 mt-1">
                <Badge :variant="getStatusVariant(selectedProject.status)">
                  {{ selectedProject.status }}
                </Badge>
                <Badge :variant="getUrgencyVariant(selectedProject.urgency)">
                  {{ selectedProject.urgency }}
                </Badge>
              </div>
            </div>
            <Button variant="text" size="sm" @click="closeProjectDetails">
              <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fill-rule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clip-rule="evenodd"
                />
              </svg>
            </Button>
          </div>

          <ProjectDetails :project="selectedProject" />
        </div>
        <div
          v-else
          class="h-full flex items-center justify-center text-gray-500 p-6 text-center"
        >
          <div>
            <div
              class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4"
            >
              <svg
                class="h-6 w-6 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
            </div>
            <p>Выберите проект, чтобы увидеть задачи</p>
          </div>
        </div>
      </div>
    </main>

    <!-- Модальное окно для проекта -->
    <Modal :show="showProjectModal" @close="closeProjectModal">
      <template #header>
        {{ selectedProjectForEdit ? "Редактировать проект" : "Новый проект" }}
      </template>

      <ProjectForm
        :project="selectedProjectForEdit"
        @submit="saveProject"
        @cancel="closeProjectModal"
      />
    </Modal>

    <!-- Модальное окно настроек синхронизации -->
    <Modal :show="showSyncSettings" @close="showSyncSettings = false">
      <template #header> Настройки синхронизации </template>

      <YandexDiskSettings />
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { Project } from "~/types";
import { useProjectStore } from "~/stores/projects";
import ProjectDetails from "../components/ProjectDetails.vue";
import ProjectForm from "../components/ProjectForm.vue";
import ProjectCard from "../components/ProjectCard.vue";
import YandexDiskSettings from "../components/YandexDiskSettings.vue";
import SyncStatus from "../components/SyncStatus.vue";
import Modal from "../components/Modal.vue";
import Badge from "../components/ui/Badge.vue";
import Button from "../components/ui/Button.vue";

const projectStore = useProjectStore();
const showProjectModal = ref(false);
const showSyncSettings = ref(false);
const selectedProject = ref<Project | undefined>(undefined);
const selectedProjectForEdit = ref<Project | undefined>(undefined);
const isLoading = ref(true);
const error = ref<string | null>(null);

onMounted(async () => {
  try {
    await projectStore.loadProjects();
  } catch (err) {
    error.value = "Ошибка при загрузке проектов";
    console.error("Ошибка загрузки:", err);
  } finally {
    isLoading.value = false;
  }
});

function getStatusVariant(status: string) {
  switch (status) {
    case "В работе":
      return "yellow";
    case "Завершен":
      return "green";
    case "Отложен":
      return "gray";
    default:
      return "gray";
  }
}

function getUrgencyVariant(urgency: string) {
  switch (urgency) {
    case "Высокая":
      return "red";
    case "Средняя":
      return "yellow";
    case "Низкая":
      return "blue";
    default:
      return "gray";
  }
}

function showProjectDetails(project: Project) {
  selectedProject.value = project;
}

function closeProjectDetails() {
  selectedProject.value = undefined;
}

function openProjectModal(project?: Project) {
  selectedProjectForEdit.value = project;
  showProjectModal.value = true;
}

function closeProjectModal() {
  showProjectModal.value = false;
  selectedProjectForEdit.value = undefined;
}

async function saveProject(projectData: Omit<Project, "id" | "tasks">) {
  try {
    if (selectedProjectForEdit.value) {
      await projectStore.updateProject({
        ...selectedProjectForEdit.value,
        ...projectData,
      });
    } else {
      await projectStore.createProject(projectData);
    }
    closeProjectModal();
  } catch (error) {
    console.error("Ошибка при сохранении проекта:", error);
    alert("Произошла ошибка при сохранении проекта");
  }
}

async function deleteProject(project: Project) {
  if (confirm("Вы уверены, что хотите удалить этот проект?")) {
    try {
      await projectStore.deleteProject(project.id);
      if (selectedProject.value?.id === project.id) {
        selectedProject.value = undefined;
      }
    } catch (error) {
      console.error("Ошибка при удалении проекта:", error);
      alert("Произошла ошибка при удалении проекта");
    }
  }
}

async function exportProjects() {
  try {
    const data = await projectStore.exportProjects();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `projects_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Ошибка экспорта:", error);
    alert("Ошибка при экспорте данных");
  }
}

async function importProjects() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json";

  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result as string;
        await projectStore.importProjects(data);
        alert("Данные успешно импортированы!");
      } catch (error) {
        console.error("Ошибка импорта:", error);
        alert("Ошибка при импорте файла");
      }
    };
    reader.readAsText(file);
  };

  input.click();
}
</script>
