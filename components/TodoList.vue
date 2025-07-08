<template>
  <div class="bg-white shadow sm:rounded-lg">
    <div class="px-4 py-5 sm:p-6">
      <h3 class="text-lg font-medium leading-6 text-gray-900 mb-4">
        Задачи проекта
      </h3>

      <!-- Форма добавления задачи -->
      <form @submit.prevent="addNewTodo" class="mb-6">
        <div class="flex gap-2">
          <input
            type="text"
            v-model="newTodoText"
            placeholder="Новая задача"
            class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          <button
            type="submit"
            :disabled="!newTodoText.trim()"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            Добавить
          </button>
        </div>
      </form>

      <!-- Список задач -->
      <div class="space-y-2">
        <div
          v-for="task in project.tasks"
          :key="task.id"
          class="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-md"
        >
          <input
            type="checkbox"
            v-model="task.completed"
            @change="toggleTask(task.id)"
            class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />

          <span
            v-if="!task.editing"
            :class="{ 'line-through text-gray-400': task.completed }"
            class="flex-1"
          >
            {{ task.title }}
          </span>

          <input
            v-else
            type="text"
            v-model="task.editText"
            @keyup.enter="saveTaskEdit(task)"
            @keyup.esc="cancelTaskEdit(task)"
            class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />

          <div class="flex gap-2">
            <button
              v-if="!task.editing"
              @click="startTaskEdit(task)"
              class="text-gray-400 hover:text-gray-500"
            >
              <span class="sr-only">Редактировать</span>
              ✏️
            </button>
            <button
              v-else
              @click="saveTaskEdit(task)"
              class="text-green-600 hover:text-green-700"
            >
              <span class="sr-only">Сохранить</span>
              ✓
            </button>
            <button
              @click="deleteTask(task.id)"
              class="text-red-400 hover:text-red-500"
            >
              <span class="sr-only">Удалить</span>
              ❌
            </button>
          </div>
        </div>

        <div
          v-if="!project.tasks.length"
          class="text-center text-gray-500 py-4"
        >
          Нет задач
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useProjectStore } from "~/stores/projects";
import type { Project } from "~/types";

const props = defineProps<{
  project: Project;
}>();

const projectStore = useProjectStore();
const newTodoText = ref("");

// Добавление новой задачи
function addNewTodo() {
  if (newTodoText.value.trim()) {
    projectStore.addTodo(props.project.id, newTodoText.value.trim());
    newTodoText.value = "";
  }
}

// Переключение статуса задачи
function toggleTask(taskId: string) {
  projectStore.toggleTask(props.project.id, taskId);
}

// Удаление задачи
function deleteTask(taskId: string) {
  projectStore.deleteTodo(props.project.id, taskId);
}

// Редактирование задачи
function startTaskEdit(task: any) {
  task.editing = true;
  task.editText = task.title;
}

function saveTaskEdit(task: any) {
  if (task.editText?.trim()) {
    projectStore.updateTodo(props.project.id, task.id, {
      title: task.editText.trim(),
    });
  }
  task.editing = false;
  delete task.editText;
}

function cancelTaskEdit(task: any) {
  task.editing = false;
  delete task.editText;
}
</script>
