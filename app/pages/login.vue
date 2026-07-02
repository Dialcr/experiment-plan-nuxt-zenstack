<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import {
    Alert,
    Button,
    Card,
    Checkbox,
    FormControl,
    Password,
} from "frappe-ui";

definePageMeta({
    middleware: "guest",
});

const supabase = useSupabaseClient();
const redirectInfo = useSupabaseCookieRedirect();

const form = reactive({
    email: "",
    password: "",
    remember: true,
});

const submitted = ref(false);
const loading = ref(false);
const errorMessage = ref("");

const errors = computed(() => {
    if (!submitted.value) return {} as Record<string, string>;

    const e: Record<string, string> = {};
    if (!form.email.trim()) e.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        e.email = "Enter a valid email.";
    }
    if (!form.password) e.password = "Password is required.";
    return e;
});

const isValid = computed(() => Object.keys(errors.value).length === 0);

function getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : "Unable to log in.";
}

async function submit() {
    submitted.value = true;
    errorMessage.value = "";
    if (!isValid.value) return;

    try {
        loading.value = true;
        const { error } = await supabase.auth.signInWithPassword({
            email: form.email,
            password: form.password,
        });

        if (error) throw error;

        const redirectPath = redirectInfo.pluck();
        await navigateTo(redirectPath || "/");
    } catch (error) {
        errorMessage.value = getErrorMessage(error);
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
            class="w-full max-w-md"
            title="Log in"
            subtitle="Welcome back. Enter your account details to continue."
        >
            <Alert
                v-if="errorMessage"
                :model-value="true"
                title="Unable to log in"
                :description="errorMessage"
                theme="red"
                class="mb-5"
                @update:model-value="errorMessage = ''"
            />

            <form class="space-y-4" @submit.prevent="submit">
                <FormControl
                    v-model="form.email"
                    type="email"
                    label="Email"
                    placeholder="you@example.com"
                    :error="errors.email"
                    autocomplete="email"
                    required
                />

                <Password
                    v-model="form.password"
                    label="Password"
                    placeholder="Enter your password"
                    :error="errors.password"
                    autocomplete="current-password"
                    required
                />

                <div class="flex items-center justify-between gap-3">
                    <Checkbox v-model="form.remember" label="Remember me" />
                    <NuxtLink
                        to="/signup"
                        class="text-p-sm text-ink-blue-6 hover:text-ink-blue-7"
                    >
                        Create account
                    </NuxtLink>
                </div>

                <Button
                    variant="solid"
                    theme="blue"
                    type="submit"
                    class="w-full"
                    :loading="loading"
                    loading-text="Logging in"
                >
                    Log in
                </Button>
            </form>
        </Card>
    </main>
</template>
