<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show"
        class="fixed inset-0 z-50 overflow-y-auto"
        @click="$emit('close')"
      >
        <!-- Затемнение фона -->
        <div
          class="fixed inset-0 bg-gray-900 bg-opacity-75 backdrop-blur-sm transition-opacity"
        ></div>

        <!-- Модальное окно -->
        <div class="flex min-h-screen items-center justify-center p-6">
          <div
            class="relative w-full max-w-3xl transform overflow-hidden rounded-xl bg-white shadow-2xl transition-all"
            @click.stop
          >
            <!-- Заголовок -->
            <div class="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div class="flex items-center justify-between">
                <h3 class="text-xl font-semibold leading-6 text-gray-900">
                  <slot name="header"></slot>
                </h3>
                <button
                  type="button"
                  class="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  @click="$emit('close')"
                >
                  <span class="sr-only">Закрыть</span>
                  <svg
                    class="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Содержимое -->
            <div class="px-6 py-5">
              <div class="space-y-6">
                <slot></slot>
              </div>
            </div>

            <!-- Подвал, если нужен -->
            <slot name="footer">
              <div
                v-if="$slots.footer"
                class="bg-gray-50 px-6 py-4 border-t border-gray-200"
              >
                <slot name="footer"></slot>
              </div>
            </slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  show: boolean;
}>();

defineEmits<{
  (e: "close"): void;
}>();
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.modal-enter-to,
.modal-leave-from {
  opacity: 1;
  transform: scale(1);
}
</style>
