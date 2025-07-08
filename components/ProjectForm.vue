<template>
  <div class="bg-white shadow sm:rounded-lg">
    <div class="px-4 py-5 sm:p-6">
      <h3 class="text-lg font-medium leading-6 text-gray-900">
        {{ project ? "Редактировать проект" : "Создать новый проект" }}
      </h3>

      <form @submit.prevent="handleSubmit" class="mt-5 space-y-4">
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700"
            >Название</label
          >
          <input
            type="text"
            id="name"
            v-model="form.name"
            required
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label
            for="description"
            class="block text-sm font-medium text-gray-700"
            >Описание</label
          >
          <textarea
            id="description"
            v-model="form.description"
            rows="3"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="status" class="block text-sm font-medium text-gray-700"
              >Статус</label
            >
            <select
              id="status"
              v-model="form.status"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="В работе">В работе</option>
              <option value="Завершен">Завершен</option>
              <option value="Отложен">Отложен</option>
            </select>
          </div>

          <div>
            <label for="urgency" class="block text-sm font-medium text-gray-700"
              >Срочность</label
            >
            <select
              id="urgency"
              v-model="form.urgency"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="Высокая">Высокая</option>
              <option value="Средняя">Средняя</option>
              <option value="Низкая">Низкая</option>
            </select>
          </div>

          <div>
            <label
              for="deadline"
              class="block text-sm font-medium text-gray-700"
              >Дедлайн</label
            >
            <input
              type="date"
              id="deadline"
              v-model="form.deadline"
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        <div class="flex justify-end space-x-3">
          <button
            type="button"
            @click="$emit('cancel')"
            class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Отмена
          </button>
          <button
            type="submit"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {{ project ? "Сохранить" : "Создать" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { Project } from "~/types";

const props = defineProps<{
  project?: Project;
}>();

const emit = defineEmits<{
  (e: "submit", project: Omit<Project, "id" | "tasks">): void;
  (e: "cancel"): void;
}>();

const form = ref({
  name: "",
  description: "",
  status: "В работе" as const,
  urgency: "Средняя" as const,
  deadline: new Date().toISOString().split("T")[0],
});

// Следим за изменением props.project и обновляем форму
watch(
  () => props.project,
  (newProject) => {
    if (newProject) {
      form.value = {
        name: newProject.name,
        description: newProject.description,
        status: newProject.status,
        urgency: newProject.urgency,
        deadline: newProject.deadline,
      };
    }
  },
  { immediate: true }
);

function handleSubmit() {
  emit("submit", {
    name: form.value.name,
    description: form.value.description,
    status: form.value.status,
    urgency: form.value.urgency,
    deadline: form.value.deadline,
  });
}
</script>
