<template>
    <v-container>
        <v-row class="py-12">
            <v-col cols="6">
                <div class="text-h4 font-weight-medium text-primary">Get started for free</div>
                <div class="text-subtitle-1 text-secondary mb-6">
                    Already have an account?
                    <span class="link button-hover" @click="$router.push({ name: RouteName.LOGIN })">Login</span>
                </div>

                <v-row>
                    <v-col cols="6">
                        <div class="text-label text-primary">First name</div>
                        <v-text-field
                            variant="solo-filled"
                            type="text"
                            placeholder="John"
                            v-model="email"
                        ></v-text-field>
                    </v-col>
                    <v-col cols="6">
                        <div class="text-label text-primary">Last name</div>
                        <v-text-field
                            variant="solo-filled"
                            type="text"
                            placeholder="Doe"
                            v-model="email"
                        ></v-text-field>
                    </v-col>
                    <v-col cols="12">
                        <div class="text-label text-primary">Email</div>
                        <v-text-field
                            variant="solo-filled"
                            type="email"
                            placeholder="john.doe@domain.com"
                            v-model="email"
                        ></v-text-field>
                    </v-col>
                    <v-col cols="12">
                        <div class="text-label text-primary">Password</div>
                        <v-text-field
                            :append-inner-icon="passwordVisible ? 'mdi-eye-off' : 'mdi-eye'"
                            :type="passwordVisible ? 'text' : 'password'"
                            placeholder="****************"
                            variant="solo-filled"
                            v-model="password"
                            @click:append-inner="passwordVisible = !passwordVisible"
                        ></v-text-field>
                    </v-col>
                    <v-col cols="12">
                        <div class="d-flex justify-start">
                            <v-checkbox v-model="rememberMe" style="margin-top: -18px"></v-checkbox>
                            <div class="text-caption text-secondary">
                                By checking the box you agree to our
                                <span class="link button-hover">Terms of Service</span> and
                                <span class="link button-hover">Privacy Policy.</span>
                            </div>
                        </div>
                    </v-col>
                </v-row>

                <div class="w-100 mt-2 px-5 rounded login-button button-hover mb-12" @click="login">
                    <div v-if="!isLoading" class="d-flex justify-space-between">
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
                <div class="text-h3 font-weight-thin text-primary mb-6 w-100 text-center">Apoio</div>
                <div class="text-h3 font-weight-medium text-primary w-100 text-center">
                    Experience the future of productivity.
                </div>
            </v-col>
        </v-row>
    </v-container>
</template>

<script lang="ts" setup>
    import { ref } from 'vue';
    import { useUserStore } from '../stores/user';
    import { useToast } from 'vue-toastification';
    import { useRouter } from 'vue-router';
    import { EMAIL_STORAGE_KEY } from '../constants';
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
