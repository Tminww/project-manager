<template>
  <div class="h-screen flex flex-col">
    <header class="bg-white shadow shrink-0">
      <div class="w-full px-4 py-6 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between">
          <h1 class="text-3xl font-bold tracking-tight text-gray-900">
            Менеджер проектов
          </h1>
          <div class="flex items-center gap-4">
            <span class="text-sm text-gray-500">
              Последнее сохранение: {{ projectStore.lastSavedFormatted }}
            </span>
            <Button variant="secondary" size="sm" @click="exportProjects">
              Экспорт
            </Button>
            <Button variant="secondary" size="sm" @click="importProjects">
              Импорт
            </Button>
            <Button variant="primary" @click="openProjectModal()">
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
              Нет проектов. Создайте новый проект, нажав кнопку "Новый проект".
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
          Выберите проект, чтобы увидеть задачи
        </div>
      </div>
    </main>

    <!-- Модальное окно для проекта -->
    <Modal :show="showProjectModal" @close="closeProjectModal">
      <template #header>
        {{ selectedProject ? "Редактировать проект" : "Новый проект" }}
      </template>

      <ProjectForm
        :project="selectedProject"
        @submit="saveProject"
        @cancel="closeProjectModal"
      />
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { Project } from "~/types";
import { useProjectStore } from "~/stores/projects";
import ProjectDetails from "../components/ProjectDetails.vue";
import Badge from "../components/ui/Badge.vue";
import Button from "../components/ui/Button.vue";

const projectStore = useProjectStore();
const showProjectModal = ref(false);
const selectedProject = ref<Project | undefined>(undefined);
const isLoading = ref(true);
const error = ref<string | null>(null);

onMounted(async () => {
  try {
    await projectStore.loadProjects();
  } catch (err) {
    error.value = "Ошибка при загрузке проектов";
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
  console.log("Показываю детали проекта:", project);
  selectedProject.value = project;
}

function closeProjectDetails() {
  console.log("Закрываю детали проекта");
  selectedProject.value = undefined;
}

function openProjectModal(project?: Project) {
  selectedProject.value = project;
  showProjectModal.value = true;
}

function closeProjectModal() {
  showProjectModal.value = false;
}

async function saveProject(projectData: Omit<Project, "id" | "tasks">) {
  try {
    if (selectedProject.value) {
      await projectStore.updateProject({
        ...selectedProject.value,
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

async function deleteTask(projectId: string, taskId: string) {
  if (confirm("Вы уверены, что хотите удалить эту задачу?")) {
    try {
      await projectStore.deleteTodo(projectId, taskId);
    } catch (error) {
      console.error("Ошибка при удалении задачи:", error);
      alert("Произошла ошибка при удалении задачи");
    }
  }
}

async function toggleTask(projectId: string, taskId: string) {
  try {
    await projectStore.toggleTask(projectId, taskId);
  } catch (error) {
    console.error("Ошибка при изменении статуса задачи:", error);
    alert("Произошла ошибка при изменении статуса задачи");
  }
}

function calculateProgress(project: Project): number {
  if (!project.tasks.length) return 0;
  const completed = project.tasks.filter((task) => task.completed).length;
  return Math.round((completed / project.tasks.length) * 100);
}

function getProgressVariant(
  progress: number
): "primary" | "success" | "warning" | "danger" {
  if (progress >= 100) return "success";
  if (progress >= 70) return "primary";
  if (progress >= 30) return "warning";
  return "danger";
}

async function exportProjects() {
  const data = JSON.stringify(projectStore.projects, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `projects_${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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
        const data = JSON.parse(e.target?.result as string);
        await projectStore.importProjects(data);
      } catch (error) {
        alert("Ошибка при импорте файла");
      }
    };
    reader.readAsText(file);
  };

  input.click();
}
</script>
