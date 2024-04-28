/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Plugins
import { registerPlugins } from './plugins';

import Toast, { POSITION } from 'vue-toastification';
import 'vue-toastification/dist/index.css';
import './styles/main.scss';

// Components
import App from './App.vue';

// Composables
import { createApp } from 'vue';

const app = createApp(App);

registerPlugins(app);

app.use(Toast, {
    position: POSITION.BOTTOM_CENTER,
});

app.mount('#app');
