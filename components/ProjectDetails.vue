<template>
  <div class="space-y-6">
    <!-- Информация о проекте -->
    <div>
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-lg font-medium text-gray-900">{{ project.name }}</h3>
          <p class="mt-1 text-sm text-gray-500">
            Дедлайн: {{ formatDate(project.deadline) }}
          </p>
        </div>
        <div class="flex gap-2">
          <span
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
            :class="statusColor"
          >
            {{ project.status }}
          </span>
          <span
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
            :class="urgencyColor"
          >
            {{ project.urgency }}
          </span>
        </div>
      </div>
      <p class="text-sm text-gray-600">{{ project.description }}</p>
    </div>

    <!-- Прогресс -->
    <div>
      <div class="flex justify-between text-sm text-gray-500 mb-2">
        <span>Прогресс выполнения</span>
        <span>{{ completedTasks }} из {{ project.tasks.length }}</span>
      </div>
      <div class="h-2 bg-white rounded-full overflow-hidden">
        <div
          class="h-full bg-green-500 transition-all"
          :style="{ width: progressPercentage + '%' }"
        />
      </div>
    </div>

    <!-- Задачи -->
    <div>
      <div class="flex items-center justify-between mb-4">
        <h4 class="text-base font-medium text-gray-900">Задачи</h4>
      </div>

      <!-- Форма новой задачи -->
      <form @submit.prevent="addNewTask" class="mb-4 flex gap-2">
        <input
          type="text"
          v-model="newTaskTitle"
          placeholder="Добавить новую задачу..."
          class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white"
        />
        <button
          type="submit"
          class="inline-flex items-center p-2 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-full transition-colors"
          title="Добавить задачу"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      </form>

      <!-- Список задач -->
      <div class="space-y-2">
        <div
          v-for="task in sortedTasks"
          :key="task.id"
          class="flex items-start gap-3 p-3 bg-white rounded-lg shadow-sm"
        >
          <div class="flex-shrink-0 pt-1">
            <input
              type="checkbox"
              :checked="task.completed"
              @change="toggleTask(task.id)"
              class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
            />
          </div>

          <div v-if="!task.editing" class="flex-1 break-words">
            <span :class="{ 'line-through text-gray-400': task.completed }">
              {{ task.title }}
            </span>
          </div>

          <input
            v-else
            type="text"
            v-model="task.editText"
            @keyup.enter="saveTaskEdit(task)"
            @keyup.esc="cancelTaskEdit(task)"
            class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white"
          />

          <div class="flex gap-2 flex-shrink-0">
            <button
              v-if="!task.editing"
              @click="startTaskEdit(task)"
              class="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-50 rounded transition-colors"
              title="Редактировать"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </button>
            <button
              v-else
              @click="saveTaskEdit(task)"
              class="text-green-600 hover:text-green-700 p-1 hover:bg-green-50 rounded transition-colors"
              title="Сохранить"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </button>
            <button
              @click="deleteTask(task.id)"
              class="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded transition-colors"
              title="Удалить"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>

        <div
          v-if="!project.tasks.length"
          class="text-center text-gray-500 py-8 bg-white rounded-lg"
        >
          Нет задач. Добавьте первую задачу!
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useProjectStore } from "~/stores/projects";
import type { Project, Task } from "~/types";

const props = defineProps<{
  project: Project;
}>();

const projectStore = useProjectStore();
const newTaskTitle = ref("");

// Вычисляемые свойства для отображения статуса
const statusColor = computed(() => {
  switch (props.project.status) {
    case "В работе":
      return "bg-yellow-100 text-yellow-800";
    case "Завершен":
      return "bg-green-100 text-green-800";
    case "Отложен":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
});

const urgencyColor = computed(() => {
  switch (props.project.urgency) {
    case "Высокая":
      return "bg-red-100 text-red-800";
    case "Средняя":
      return "bg-orange-100 text-orange-800";
    case "Низкая":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
});

const completedTasks = computed(
  () => props.project.tasks.filter((task) => task.completed).length
);

const progressPercentage = computed(() =>
  props.project.tasks.length
    ? (completedTasks.value / props.project.tasks.length) * 100
    : 0
);

const sortedTasks = computed(() => {
  return [...props.project.tasks].sort((a, b) => {
    if (a.completed === b.completed) return 0;
    return a.completed ? 1 : -1;
  });
});

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("ru-RU");
}

async function addNewTask() {
  if (!newTaskTitle.value.trim()) return;

  try {
    await projectStore.addTodo(props.project.id, newTaskTitle.value.trim());
    newTaskTitle.value = "";
  } catch (error) {
    console.error("Ошибка при добавлении задачи:", error);
    alert("Произошла ошибка при добавлении задачи");
  }
}

async function toggleTask(taskId: string) {
  try {
    await projectStore.toggleTask(props.project.id, taskId);
  } catch (error) {
    console.error("Ошибка при изменении статуса задачи:", error);
    alert("Произошла ошибка при изменении статуса задачи");
  }
}

async function deleteTask(taskId: string) {
  if (confirm("Вы уверены, что хотите удалить эту задачу?")) {
    try {
      await projectStore.deleteTodo(props.project.id, taskId);
    } catch (error) {
      console.error("Ошибка при удалении задачи:", error);
      alert("Произошла ошибка при удалении задачи");
    }
  }
}

function startTaskEdit(task: Task) {
  task.editing = true;
  task.editText = task.title;
}

function cancelTaskEdit(task: Task) {
  task.editing = false;
  task.editText = "";
}

async function saveTaskEdit(task: Task) {
  if (!task.editText?.trim()) return;

  try {
    await projectStore.updateTodo(props.project.id, task.id, {
      title: task.editText.trim(),
    });
    task.editing = false;
    task.editText = "";
  } catch (error) {
    console.error("Ошибка при обновлении задачи:", error);
    alert("Произошла ошибка при обновлении задачи");
  }
}
</script>
