<template>
    <v-container>
        <v-row class="py-12">
            <v-col cols="6">
                <div class="text-h3 font-weight-thin text-primary mb-6">Apoio</div>
                <div class="text-h4 font-weight-medium text-primary">Welcome back!</div>
                <div class="text-subtitle-1 text-secondary mb-6">
                    No account yet?
                    <span class="link button-hover" @click="$router.push({ name: RouteName.SIGNUP })">Join Now</span>
                </div>

                <div class="text-label text-primary mb-1">Email</div>
                <v-text-field
                    variant="solo-filled"
                    type="email"
                    placeholder="john.doe@domain.com"
                    v-model="email"
                ></v-text-field>

                <div class="text-label text-primary mb-1 mt-4">Password</div>
                <v-text-field
                    :append-inner-icon="passwordVisible ? 'mdi-eye-off' : 'mdi-eye'"
                    :type="passwordVisible ? 'text' : 'password'"
                    placeholder="****************"
                    variant="solo-filled"
                    v-model="password"
                    @click:append-inner="passwordVisible = !passwordVisible"
                ></v-text-field>
                <div class="d-flex justify-space-between">
                    <v-checkbox class="text-caption" v-model="rememberMe" label="Remember me"></v-checkbox>
                    <v-btn class="text-caption mt-2" variant="text">Forgot password?</v-btn>
                </div>

                <div class="w-100 px-5 rounded login-button button-hover mb-12" @click="login">
                    <div v-if="!isLoading.authentication" class="d-flex justify-space-between">
                        <p class="line-height-60">Log in to Apoio</p>
                        <v-icon class="line-height-60" style="height: 60px" icon="mdi-arrow-right"></v-icon>
                    </div>
                    <div v-else class="d-flex justify-center py-4">
                        <v-progress-circular color="primary" indeterminate :width="6"></v-progress-circular>
                    </div>
                </div>

                <HorizontalLine with-text="or" />

                <div class="w-100 mt-12 pa-1 rounded login-button button-hover">
                    <div class="bg-background w-100 d-flex justify-start rounded px-5">
                        <v-icon class="line-height-60" style="height: 60px" icon="mdi-google"></v-icon>
                        <p class="pl-4 line-height-60">Log in with Google</p>
                    </div>
                </div>
            </v-col>
            <v-col cols="6" class="pa-12">
                <div class="text-h3 font-weight-medium text-primary">Experience the future of productivity.</div>
            </v-col>
        </v-row>
    </v-container>
</template>

<script lang="ts" setup>
    import { ref } from 'vue';
    import { useUserStore } from '../stores/user';
    import { useToast } from 'vue-toastification';
    import { useRouter } from 'vue-router';
    import { EMAIL_STORAGE_KEY } from '../constants/localStorageKeys';
    import { storeToRefs } from 'pinia';
    import { RouteName } from '../types/router';

    const userStore = useUserStore();
    const toast = useToast();
    const router = useRouter();

    const { isLoading } = storeToRefs(userStore);

    const passwordVisible = ref(false);
    const email = ref<string>(localStorage.getItem(EMAIL_STORAGE_KEY) ?? '');
    const password = ref<string>();
    const rememberMe = ref(!!localStorage.getItem(EMAIL_STORAGE_KEY));

    async function login() {
        if (isLoading.value.authentication) {
            return;
        }

        if (!email.value || !password.value) {
            toast.error('Email and passowrd required');
            return;
        }

        const success = await userStore.login(email.value, password.value);

        if (!success) {
            return;
        }

        if (rememberMe.value) {
            localStorage.setItem(EMAIL_STORAGE_KEY, email.value);
        } else {
            localStorage.removeItem(EMAIL_STORAGE_KEY);
        }

        router.push({ name: RouteName.CHAT });
    }
</script>

<style>
    .v-input__details {
        display: none;
    }
</style>

<style scoped>
    .line-height-60 {
        line-height: 60px;
    }
</style>
