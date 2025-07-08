<template>
  <button
    :class="[
      'px-4 py-2 rounded-lg font-medium transition-colors',
      variant === 'primary'
        ? 'bg-blue-500 hover:bg-blue-600 text-white'
        : variant === 'secondary'
        ? 'bg-gray-200 hover:bg-gray-300 text-gray-800'
        : variant === 'danger'
        ? 'bg-red-500 hover:bg-red-600 text-white'
        : 'bg-transparent',
      size === 'sm'
        ? 'text-sm'
        : size === 'lg'
        ? 'text-lg px-6 py-3'
        : 'text-base',
      disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
      fullWidth ? 'w-full' : '',
      className,
    ]"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps<{
  variant?: "primary" | "secondary" | "danger" | "text";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
}>();

defineEmits<{
  (e: "click", event: MouseEvent): void;
}>();
</script>
