<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent, AuthFormField } from "@nuxt/ui";

const supabase = useSupabaseClient();

const fields: AuthFormField[] = [
  {
    name: "name",
    type: "text",
    label: "Full name",
    placeholder: "Jane Doe",
    required: true,
  },
  {
    name: "email",
    type: "email",
    label: "Email",
    placeholder: "you@example.com",
    description: "We'll use this for login and account recovery.",
    required: true,
  },
  {
    name: "password",
    type: "password",
    label: "Password",
    placeholder: "Create a password",
    description: "At least 8 characters.",
    required: true,
  },
  {
    name: "confirmPassword",
    type: "password",
    label: "Confirm password",
    placeholder: "Repeat your password",
    required: true,
  },
  {
    name: "acceptTerms",
    type: "checkbox",
    label: "I accept the terms and privacy policy",
  },
];

const schema = z
  .object({
    name: z.string().min(1, "Full name is required"),
    email: z.email("Enter a valid email"),
    password: z.string().min(8, "Use at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
    acceptTerms: z.literal(true, {
      error: "You must accept the terms and privacy policy",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type Schema = z.output<typeof schema>;

const loading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const appUrl = useAppUrl();
const emailRedirectTo = computed(() => `${appUrl}/confirm`);

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unable to create account.";
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  errorMessage.value = "";
  successMessage.value = "";

  try {
    loading.value = true;
    const { data, error } = await supabase.auth.signUp({
      email: event.data.email,
      password: event.data.password,
      options: {
        emailRedirectTo: emailRedirectTo.value,
        data: {
          name: event.data.name,
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
  <div class="flex min-h-dvh items-center justify-center px-4 py-10">
    <UPageCard class="w-full max-w-md">
      <UAuthForm
        :schema="schema"
        :fields="fields"
        title="Create account"
        description="Start a project workspace with a few basic account details."
        icon="i-lucide-user-plus"
        :submit="{ label: 'Create account', block: true, loading }"
        @submit="onSubmit"
      >
        <template #validation>
          <UAlert
            v-if="successMessage"
            :description="successMessage"
            title="Check your email"
            color="success"
            icon="i-lucide-check-circle"
            :close="{
              onClick: () => {
                successMessage = '';
              },
            }"
          />
          <UAlert
            v-if="errorMessage"
            :description="errorMessage"
            title="Unable to create account"
            color="error"
            icon="i-lucide-alert-circle"
            :close="{
              onClick: () => {
                errorMessage = '';
              },
            }"
          />
        </template>
        <template #footer>
          Already have an account?
          <ULink to="/login" class="text-primary font-medium"> Log in </ULink>
          .
        </template>
      </UAuthForm>
    </UPageCard>
  </div>
</template>
