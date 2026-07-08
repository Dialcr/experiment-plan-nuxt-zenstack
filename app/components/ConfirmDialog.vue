<script setup lang="ts">
const open = defineModel<boolean>({ default: false });

const props = withDefaults(
  defineProps<{
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    color?: "error" | "warning" | "primary";
    loading?: boolean;
  }>(),
  {
    description: undefined,
    confirmLabel: "Confirm",
    cancelLabel: "Cancel",
    color: "error",
    loading: false,
  },
);

const emit = defineEmits<{
  confirm: [];
}>();

function onConfirm() {
  emit("confirm");
}

function onCancel() {
  if (!props.loading) {
    open.value = false;
  }
}
</script>

<template>
  <UModal v-model="open">
    <UCard>
      <template #header>
        <h3 class="text-lg font-semibold">{{ title }}</h3>
        <p v-if="description" class="text-sm text-(--ui-text-muted) mt-1">
          {{ description }}
        </p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            color="neutral"
            variant="outline"
            :label="cancelLabel"
            :disabled="loading"
            @click="onCancel"
          />
          <UButton
            :color="color"
            :label="confirmLabel"
            :loading="loading"
            :disabled="loading"
            @click="onConfirm"
          />
        </div>
      </template>
    </UCard>
  </UModal>
</template>
