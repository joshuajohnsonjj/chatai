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
                            v-model="firstName"
                        ></v-text-field>
                    </v-col>
                    <v-col cols="6">
                        <div class="text-label text-primary">Last name</div>
                        <v-text-field
                            variant="solo-filled"
                            type="text"
                            placeholder="Doe"
                            v-model="lastName"
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
                            <v-checkbox v-model="termsAgreed" style="margin-top: -18px"></v-checkbox>
                            <div class="text-caption text-secondary">
                                By checking the box you agree to our
                                <span class="link button-hover">Terms of Service</span> and
                                <span class="link button-hover">Privacy Policy.</span>
                            </div>
                        </div>
                    </v-col>
                </v-row>

                <div class="w-100 mt-2 px-5 rounded login-button button-hover mb-12" @click="signup">
                    <div v-if="!isLoading.authentication" class="d-flex justify-space-between">
                        <p class="line-height-60">Sign up to Apoio</p>
                        <v-icon class="line-height-60" style="height: 60px" icon="mdi-arrow-right"></v-icon>
                    </div>
                    <div v-else class="d-flex justify-center py-4">
                        <v-progress-circular color="primary" indeterminate :width="6"></v-progress-circular>
                    </div>
                </div>

                <!-- <HorizontalLine with-text="or" />

                <div class="w-100 mt-12 pa-1 rounded login-button button-hover">
                    <div class="bg-background w-100 d-flex justify-start rounded px-5">
                        <v-icon class="line-height-60" style="height: 60px" icon="mdi-google"></v-icon>
                        <p class="pl-4 line-height-60">Sign up with Google</p>
                    </div>
                </div> -->
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
    import { storeToRefs } from 'pinia';
    import { RouteName } from '../types/router';
    import { useToast } from 'vue-toastification';
    import { useRouter } from 'vue-router';

    const userStore = useUserStore();
    const { isLoading } = storeToRefs(userStore);

    const toast = useToast();

    const router = useRouter();

    const passwordVisible = ref(false);
    const firstName = ref<string>();
    const lastName = ref<string>();
    const email = ref<string>();
    const password = ref<string>();
    const termsAgreed = ref(false);

    const validPassword = (password: string): boolean => {
        if (password.length < 8) {
            toast.error('Password must be at least 8 characters in length');
            return false;
        }

        const regex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).+$/;
        if (!regex.test(password)) {
            toast.error('Password must contain an uppercase letter, lowercase letter, and number.');
            return false;
        }

        return true;
    };

    const signup = async () => {
        if (!firstName.value || !lastName.value || !email.value || !password.value) {
            toast.error('Missing required fields');
            return;
        }

        if (!email.value.includes('@')) {
            toast.error('Valid email address required');
            return;
        }

        if (!validPassword(password.value)) {
            return;
        }

        if (!termsAgreed.value) {
            toast.error('Must agree to the terms of service and privacy policy');
            return;
        }

        await userStore.signup(firstName.value, lastName.value, email.value, password.value);

        toast.success('Signup succeeded');

        router.push({ name: RouteName.SIGNUP_CONFIRMATION, query: { email: email.value } });
    };
</script>

<style scoped>
    .line-height-60 {
        line-height: 60px;
    }
</style>

<style>
    .v-input__details {
        display: none;
    }
</style>
