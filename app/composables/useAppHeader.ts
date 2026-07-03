import type { BreadcrumbItem, ButtonProps } from "@nuxt/ui";
import type { Ref } from "vue";

type AppHeaderPrimaryAction = {
    label: string;
    icon?: string;
    color?: ButtonProps["color"];
    variant?: ButtonProps["variant"];
};

type AppHeaderState = {
    breadcrumbs: BreadcrumbItem[];
    primaryAction: AppHeaderPrimaryAction | null;
};

const defaultHeaderState = (): AppHeaderState => ({
    breadcrumbs: [{ label: "Projects", to: "/projects" }],
    primaryAction: null,
});

export function useAppHeader() {
    const state = useState<AppHeaderState>("app-header", defaultHeaderState);
    const nuxtApp = useNuxtApp() as typeof useNuxtApp extends () => infer T
        ? T & {
              _appHeaderPrimaryActionHandler?: Ref<(() => void) | null>;
          }
        : never;

    nuxtApp._appHeaderPrimaryActionHandler ??= shallowRef(null);
    const actionHandler = nuxtApp._appHeaderPrimaryActionHandler;

    function setHeader(next: Partial<AppHeaderState>) {
        state.value = {
            ...state.value,
            ...next,
        };
    }

    function setPrimaryAction(
        action: AppHeaderPrimaryAction | null,
        handler?: () => void,
    ) {
        state.value.primaryAction = action;
        actionHandler.value = action ? (handler ?? null) : null;
    }

    function triggerPrimaryAction() {
        actionHandler.value?.();
    }

    function resetHeader() {
        state.value = defaultHeaderState();
        actionHandler.value = null;
    }

    const header = computed<AppHeaderState>(() => state.value);

    return {
        header,
        setHeader,
        setPrimaryAction,
        triggerPrimaryAction,
        resetHeader,
    };
}
