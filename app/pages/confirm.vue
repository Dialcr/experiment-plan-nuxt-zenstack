<script setup lang="ts">
import { Card, LoadingText } from "frappe-ui";
import { watch } from "vue";

const user = useSupabaseUser();
const redirectInfo = useSupabaseCookieRedirect();

watch(
    user,
    () => {
        if (user.value) {
            const path = redirectInfo.pluck();
            navigateTo(path || "/");
        }
    },
    { immediate: true },
);
</script>

<template>
    <main
        class="flex min-h-screen items-center justify-center bg-surface-gray-1 px-4 py-10"
    >
        <Card
            class="w-full max-w-md"
            title="Confirming sign in"
            subtitle="Please wait while Supabase finishes your session."
        >
            <LoadingText text="Signing you in..." />
        </Card>
    </main>
</template>
