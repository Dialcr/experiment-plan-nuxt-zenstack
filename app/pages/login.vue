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

const form = reactive({
    email: "",
    password: "",
    remember: true,
});

const submitted = ref(false);
const loading = ref(false);
const showSuccess = ref(false);

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

async function submit() {
    submitted.value = true;
    showSuccess.value = false;
    if (!isValid.value) return;

    loading.value = true;
    await new Promise((resolve) => setTimeout(resolve, 400));
    loading.value = false;
    showSuccess.value = true;
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
                v-if="showSuccess"
                v-model="showSuccess"
                title="Login form submitted"
                description="This demo only validates the form locally. Real auth can be wired in next."
                theme="green"
                class="mb-5"
            />

            <form class="space-y-4" @submit.prevent="submit">
                <FormControl
                    v-model="form.email"
                    type="email"
                    label="Email"
                    placeholder="you@example.com"
                    :error="errors.email"
                    required
                />

                <Password
                    v-model="form.password"
                    label="Password"
                    placeholder="Enter your password"
                    :error="errors.password"
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
