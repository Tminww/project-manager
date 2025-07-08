<template>
  <div
    class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col"
    :class="[className]"
  >
    <div
      v-if="$slots.header"
      class="px-6 py-4 bg-gray-200 border-b border-gray-200"
    >
      <slot name="header"></slot>
    </div>

    <div class="p-6 flex-1 flex flex-col">
      <slot></slot>
    </div>

    <div
      v-if="$slots.footer"
      class="px-6 py-4 bg-gray-50 border-t border-gray-200"
    >
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  className?: string;
}

withDefaults(defineProps<Props>(), {
  className: "",
});
</script>
