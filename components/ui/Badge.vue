<template>
  <span
    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium shadow-sm"
    :class="[
      variant === 'gray' && 'bg-gray-500 text-white',
      variant === 'red' && 'bg-red-500 text-white',
      variant === 'yellow' && 'bg-yellow-500 text-white',
      variant === 'green' && 'bg-green-500 text-white',
      variant === 'blue' && 'bg-blue-500 text-white',
      variant === 'indigo' && 'bg-indigo-500 text-white',
      variant === 'purple' && 'bg-purple-500 text-white',
      variant === 'pink' && 'bg-pink-500 text-white',
      className,
    ]"
  >
    <slot name="icon-left"></slot>
    <slot></slot>
    <slot name="icon-right"></slot>
  </span>
</template>

<script setup lang="ts">
interface Props {
  variant?:
    | "gray"
    | "red"
    | "yellow"
    | "green"
    | "blue"
    | "indigo"
    | "purple"
    | "pink";
  className?: string;
}

withDefaults(defineProps<Props>(), {
  variant: "gray",
  className: "",
});
</script>
