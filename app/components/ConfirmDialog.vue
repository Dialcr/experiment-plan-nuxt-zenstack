<script setup lang="ts">
const open = defineModel<boolean>("open", { default: false });

const props = withDefaults(
  defineProps<{
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    color?: "error" | "warning" | "primary";
  }>(),
  {
    description: undefined,
    confirmLabel: "Confirm",
    cancelLabel: "Cancel",
    color: "error",
  },
);

const emit = defineEmits<{
  confirm: [];
}>();

function onConfirm() {
  emit("confirm");
  open.value = false;
}
</script>

<template>
  <UModal v-model:open="open">
    <UCard>
      <template #header>
        <h3 class="text-lg font-semibold">{{ title }}</h3>
        <p v-if="description" class="text-sm text-(--ui-text-muted) mt-1">{{ description }}</p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="outline" :label="cancelLabel" @click="open = false" />
          <UButton :color="color" :label="confirmLabel" @click="onConfirm" />
        </div>
      </template>
    </UCard>
  </UModal>
</template>
