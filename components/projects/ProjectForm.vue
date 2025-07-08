<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <div class="space-y-4">
      <div>
        <label for="name" class="block text-sm font-medium text-gray-700"
          >Название</label
        >
        <input
          type="text"
          id="name"
          v-model="form.name"
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        />
      </div>

      <div>
        <label for="description" class="block text-sm font-medium text-gray-700"
          >Описание</label
        >
        <textarea
          id="description"
          v-model="form.description"
          rows="3"
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        ></textarea>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label for="status" class="block text-sm font-medium text-gray-700"
            >Статус</label
          >
          <select
            id="status"
            v-model="form.status"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          >
            <option v-for="status in statuses" :key="status" :value="status">
              {{ status }}
            </option>
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
            required
          >
            <option
              v-for="urgency in urgencies"
              :key="urgency"
              :value="urgency"
            >
              {{ urgency }}
            </option>
          </select>
        </div>
      </div>

      <div>
        <label for="deadline" class="block text-sm font-medium text-gray-700"
          >Дедлайн</label
        >
        <input
          type="date"
          id="deadline"
          v-model="form.deadline"
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2"
          >Задачи</label
        >
        <div class="space-y-2">
          <div
            v-for="(task, index) in form.tasks"
            :key="index"
            class="flex items-center gap-2"
          >
            <input
              type="text"
              v-model="task.title"
              placeholder="Название задачи"
              class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            />
            <Button
              variant="danger"
              size="sm"
              type="button"
              @click="removeTask(index)"
            >
              Удалить
            </Button>
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          type="button"
          class="mt-2"
          @click="addTask"
        >
          Добавить задачу
        </Button>
      </div>
    </div>

    <div class="flex justify-end gap-2">
      <Button variant="secondary" type="button" @click="$emit('cancel')">
        Отмена
      </Button>
      <Button variant="primary" type="submit">
        {{ project ? "Сохранить" : "Создать" }}
      </Button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { Project, ProjectStatus, ProjectUrgency, Task } from "~/types";

interface Props {
  project?: Project;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "submit", project: Project): void;
  (e: "cancel"): void;
}>();

const statuses: ProjectStatus[] = [
  "Не начат",
  "В работе",
  "На паузе",
  "Завершен",
  "Отменен",
];
const urgencies: ProjectUrgency[] = ["Низкая", "Средняя", "Высокая"];

const form = ref({
  id: "",
  name: "",
  description: "",
  status: "Не начат" as ProjectStatus,
  urgency: "Средняя" as ProjectUrgency,
  deadline: new Date().toISOString().split("T")[0],
  tasks: [] as Task[],
});

onMounted(() => {
  if (props.project) {
    form.value = {
      ...props.project,
      deadline: new Date(props.project.deadline).toISOString().split("T")[0],
    };
  }
});

function addTask() {
  form.value.tasks.push({
    id: crypto.randomUUID(),
    title: "",
    completed: false,
  });
}

function removeTask(index: number) {
  form.value.tasks.splice(index, 1);
}

function handleSubmit() {
  emit("submit", {
    ...form.value,
    id: form.value.id || crypto.randomUUID(),
  });
}
</script>
