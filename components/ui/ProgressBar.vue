<template>
  <div>
    <div class="flex justify-between items-center mb-1" v-if="showLabel">
      <span class="text-sm font-medium text-gray-700">{{ label }}</span>
      <span class="text-sm font-medium text-gray-700">{{ progress }}%</span>
    </div>
    <div class="w-full bg-gray-200 rounded-full h-2.5">
      <div
        class="h-2.5 rounded-full transition-all duration-300"
        :class="[
          variant === 'primary' && 'bg-indigo-600',
          variant === 'success' && 'bg-green-600',
          variant === 'warning' && 'bg-yellow-500',
          variant === 'danger' && 'bg-red-600',
        ]"
        :style="{ width: `${progress}%` }"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  progress: number;
  variant?: "primary" | "success" | "warning" | "danger";
  label?: string;
  showLabel?: boolean;
}

withDefaults(defineProps<Props>(), {
  variant: "primary",
  label: "Прогресс",
  showLabel: true,
});
</script>
