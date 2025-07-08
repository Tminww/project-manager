<template>
  <Card class="h-full flex flex-col">
    <template #header>
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold text-gray-900">
            {{ project.name }}
          </h3>
          <div class="flex gap-2 mt-1">
            <Badge :variant="statusVariant">{{ project.status }}</Badge>
            <Badge :variant="urgencyVariant">{{ project.urgency }}</Badge>
          </div>
        </div>
        <Button variant="secondary" size="sm" @click="$emit('edit', project)">
          <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path
              d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"
            />
          </svg>
        </Button>
      </div>
    </template>

    <div class="flex-1">
      <p class="text-gray-600">{{ project.description }}</p>
    </div>

    <div class="space-y-4 mt-auto pt-4">
      <div>
        <div class="flex justify-between text-sm text-gray-500 mb-2">
          <span>Прогресс выполнения</span>
          <span>{{ completedTasks }} из {{ project.tasks.length }}</span>
        </div>
        <ProgressBar
          :progress="calculateProgress"
          :variant="progressVariant"
          label="Выполнение задач"
        />
      </div>

      <div class="flex items-center justify-between">
        <div class="space-y-1">
          <div class="flex items-center text-sm text-gray-500">
            <svg class="w-4 h-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                clip-rule="evenodd"
              />
            </svg>
            {{ formatDate(project.deadline) }}
          </div>
          <div class="text-xs font-medium" :class="deadlineColorClasses">
            {{ deadlineText }}
          </div>
        </div>
        <div class="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            @click="$emit('view-details', project)"
          >
            Открыть задачи
          </Button>
          <Button variant="danger" size="sm" @click="$emit('delete', project)">
            <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Project } from "~/types";
import Button from "./ui/Button.vue";
import Card from "./ui/Card.vue";
import Badge from "./ui/Badge.vue";
import ProgressBar from "./ui/ProgressBar.vue";

const props = defineProps<{
  project: Project;
}>();

defineEmits<{
  (e: "edit", project: Project): void;
  (e: "delete", project: Project): void;
  (e: "view-details", project: Project): void;
}>();

const completedTasks = computed(
  () =>
    props.project.tasks.filter((task: { completed: boolean }) => task.completed)
      .length
);

const calculateProgress = computed(() => {
  if (!props.project.tasks.length) return 0;
  return Math.round((completedTasks.value / props.project.tasks.length) * 100);
});

const progressVariant = computed(() => {
  if (calculateProgress.value >= 100) return "success";
  if (calculateProgress.value >= 70) return "primary";
  if (calculateProgress.value >= 30) return "warning";
  return "danger";
});

const statusVariant = computed(() => {
  switch (props.project.status) {
    case "В работе":
      return "yellow";
    case "Завершен":
      return "green";
    case "Отложен":
      return "gray";
    default:
      return "gray";
  }
});

const urgencyVariant = computed(() => {
  switch (props.project.urgency) {
    case "Высокая":
      return "red";
    case "Средняя":
      return "yellow";
    case "Низкая":
      return "blue";
    default:
      return "gray";
  }
});

const daysUntilDeadline = computed(() => {
  const today = new Date();
  const deadline = new Date(props.project.deadline);
  const diffTime = deadline.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

const deadlineText = computed(() => {
  const days = daysUntilDeadline.value;
  if (days < 0) {
    return `Просрочено на ${Math.abs(days)} ${getDayWord(Math.abs(days))}`;
  }
  if (days === 0) {
    return "Дедлайн сегодня!";
  }
  return `Осталось ${days} ${getDayWord(days)}`;
});

const deadlineColorClasses = computed(() => {
  const days = daysUntilDeadline.value;
  if (days < 0) {
    return "text-red-600 font-semibold";
  }
  if (days === 0) {
    return "text-yellow-600 font-semibold animate-pulse";
  }
  if (days <= 3) {
    return "text-orange-500 font-semibold";
  }
  if (days <= 7) {
    return "text-yellow-600";
  }
  return "text-green-600";
});

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("ru-RU");
}

function getDayWord(days: number) {
  const lastDigit = days % 10;
  const lastTwoDigits = days % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return "дней";
  }

  switch (lastDigit) {
    case 1:
      return "день";
    case 2:
    case 3:
    case 4:
      return "дня";
    default:
      return "дней";
  }
}
</script>
