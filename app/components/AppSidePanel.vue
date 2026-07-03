<script setup lang="ts">
const open = defineModel<boolean>("open", { default: false });

withDefaults(
    defineProps<{
        title: string;
        description?: string;
        contentClass?: string;
    }>(),
    {
        description: undefined,
        contentClass: "w-full sm:max-w-md",
    },
);
</script>

<template>
    <UDrawer
        v-model:open="open"
        direction="right"
        :title="title"
        :description="description"
        :handle="false"
        :ui="{
            content: contentClass,
            body: 'flex flex-1 flex-col',
        }"
    >
        <template #body>
            <div class="flex min-h-0 flex-1 flex-col">
                <div class="min-h-0 flex-1">
                    <slot />
                </div>

                <div v-if="$slots.footer" class="pt-6">
                    <slot name="footer" />
                </div>
            </div>
        </template>
    </UDrawer>
</template>
