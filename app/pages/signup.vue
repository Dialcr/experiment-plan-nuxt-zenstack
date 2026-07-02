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
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
});

const submitted = ref(false);
const loading = ref(false);
const showSuccess = ref(false);

const errors = computed(() => {
    if (!submitted.value) return {} as Record<string, string>;

    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Full name is required.";
    if (!form.email.trim()) e.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        e.email = "Enter a valid email.";
    }
    if (!form.password) e.password = "Pick a password.";
    else if (form.password.length < 8)
        e.password = "Use at least 8 characters.";
    if (!form.confirmPassword) e.confirmPassword = "Confirm your password.";
    else if (form.confirmPassword !== form.password) {
        e.confirmPassword = "Passwords do not match.";
    }
    if (!form.acceptTerms) e.acceptTerms = "You must accept the terms.";
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
            title="Create account"
            subtitle="Start a project workspace with a few basic account details."
        >
            <Alert
                v-if="showSuccess"
                v-model="showSuccess"
                title="Signup form submitted"
                description="This demo only validates the form locally. User creation can be wired to ZenStack next."
                theme="green"
                class="mb-5"
            />

            <form class="space-y-4" @submit.prevent="submit">
                <FormControl
                    v-model="form.name"
                    type="text"
                    label="Full name"
                    placeholder="Jane Doe"
                    :error="errors.name"
                    required
                />

                <FormControl
                    v-model="form.email"
                    type="email"
                    label="Email"
                    description="We'll use this for login and account recovery."
                    placeholder="you@example.com"
                    :error="errors.email"
                    required
                />

                <Password
                    v-model="form.password"
                    label="Password"
                    description="At least 8 characters."
                    placeholder="Create a password"
                    :error="errors.password"
                    required
                />

                <Password
                    v-model="form.confirmPassword"
                    label="Confirm password"
                    placeholder="Repeat your password"
                    :error="errors.confirmPassword"
                    required
                />

                <Checkbox
                    v-model="form.acceptTerms"
                    label="I accept the terms and privacy policy"
                    :error="errors.acceptTerms"
                    required
                />

                <Button
                    variant="solid"
                    theme="blue"
                    type="submit"
                    class="w-full"
                    :loading="loading"
                    loading-text="Creating account"
                >
                    Create account
                </Button>
            </form>

            <p class="mt-5 text-center text-p-sm text-ink-gray-6">
                Already have an account?
                <NuxtLink
                    to="/login"
                    class="text-ink-blue-6 hover:text-ink-blue-7"
                >
                    Log in
                </NuxtLink>
            </p>
        </Card>
    </main>
</template>
