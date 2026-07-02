import { FrappeUI } from 'frappe-ui';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(FrappeUI, {
    resources: false,
    call: false,
    socketio: false,
  });
});
