<template>
  <Card class="h-full">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900">
          {{ project.name }}
        </h3>
        <div class="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            @click.stop="$emit('edit', project)"
          >
            <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"
              />
            </svg>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            @click.stop="$emit('delete', project)"
          >
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
    </template>

    <div class="space-y-4">
      <p class="text-gray-600">{{ project.description }}</p>

      <div>
        <ProgressBar
          :progress="calculateProgress"
          :variant="progressVariant"
          label="Выполнение задач"
        />
      </div>

      <div class="flex items-center justify-between text-sm text-gray-500">
        <span>{{ project.tasks.length }} задач</span>
        <span>{{ completedTasks }} выполнено</span>
      </div>

      <div class="flex justify-end">
        <Button
          variant="secondary"
          size="sm"
          @click="$emit('view-details', project)"
          class="mt-4"
        >
          Открыть детали
        </Button>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Project } from "~/types";

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
</script>
