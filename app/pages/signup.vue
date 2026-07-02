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
const requestUrl = useRequestURL();

const form = reactive({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
});

const submitted = ref(false);
const loading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

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
const emailRedirectTo = computed(() => `${requestUrl.origin}/confirm`);

function getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : "Unable to create account.";
}

async function submit() {
    submitted.value = true;
    errorMessage.value = "";
    successMessage.value = "";
    if (!isValid.value) return;

    try {
        loading.value = true;
        const { data, error } = await supabase.auth.signUp({
            email: form.email,
            password: form.password,
            options: {
                emailRedirectTo: emailRedirectTo.value,
                data: {
                    name: form.name.trim(),
                },
            },
        });

        if (error) throw error;

        if (data.session) {
            await navigateTo("/");
            return;
        }

        successMessage.value =
            "Account created. Check your email to confirm your signup.";
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
            title="Create account"
            subtitle="Start a project workspace with a few basic account details."
        >
            <Alert
                v-if="successMessage"
                :model-value="true"
                title="Check your email"
                :description="successMessage"
                theme="green"
                class="mb-5"
                @update:model-value="successMessage = ''"
            />

            <Alert
                v-if="errorMessage"
                :model-value="true"
                title="Unable to create account"
                :description="errorMessage"
                theme="red"
                class="mb-5"
                @update:model-value="errorMessage = ''"
            />

            <form class="space-y-4" @submit.prevent="submit">
                <FormControl
                    v-model="form.name"
                    type="text"
                    label="Full name"
                    placeholder="Jane Doe"
                    :error="errors.name"
                    autocomplete="name"
                    required
                />

                <FormControl
                    v-model="form.email"
                    type="email"
                    label="Email"
                    description="We'll use this for login and account recovery."
                    placeholder="you@example.com"
                    :error="errors.email"
                    autocomplete="email"
                    required
                />

                <Password
                    v-model="form.password"
                    label="Password"
                    description="At least 8 characters."
                    placeholder="Create a password"
                    :error="errors.password"
                    autocomplete="new-password"
                    required
                />

                <Password
                    v-model="form.confirmPassword"
                    label="Confirm password"
                    placeholder="Repeat your password"
                    :error="errors.confirmPassword"
                    autocomplete="new-password"
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
