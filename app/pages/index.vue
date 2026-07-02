<script setup lang="ts">
import { Button, Card } from "frappe-ui";

const supabase = useSupabaseClient();
const user = useSupabaseUser();
const loading = ref(false);
const errorMessage = ref("");

async function signOut() {
    try {
        loading.value = true;
        errorMessage.value = "";
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        await navigateTo("/login");
    } catch (error) {
        errorMessage.value =
            error instanceof Error ? error.message : "Unable to sign out.";
    } finally {
        loading.value = false;
    }
}
</script>

<template>
    <main
        class="flex min-h-screen items-center justify-center bg-surface-gray-1 px-4 py-10"
    >
        <Card
            class="w-full max-w-xl text-center"
            title="You're signed in"
            :subtitle="user?.email ?? 'Supabase session is active.'"
        >
            <p v-if="errorMessage" class="mb-4 text-p-sm text-ink-red-6">
                {{ errorMessage }}
            </p>
            <Button
                variant="solid"
                theme="red"
                :loading="loading"
                loading-text="Signing out"
                @click="signOut"
            >
                Sign out
            </Button>
        </Card>
    </main>
</template>
