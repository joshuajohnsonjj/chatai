<template>
    <div class="w-100 h-100 bg-surface d-flex">
        <div class="bg-background rounded-lg pt-14 px-14 pb-10 msg-container">
            <v-img src="@/assets/mailbox.png" height="70" />

            <div class="text-primary text-h6 font-weight-bold text-center mt-6">Check your email</div>
            <div class="text-primary text-body-2 text-center mt-1">
                Enter the 6-digit code we just sent to <b>{{ $route.query.email }}</b> to proceed.
            </div>

            <v-hover>
                <template v-slot:default="{ isHovering, props }">
                    <v-text-field
                        v-bind="props"
                        class="mt-8 field rounded"
                        :class="{ hovering: isHovering }"
                        placeholder="Enter 6-digit code"
                        variant="solo"
                        :loading="isLoading.authentication"
                        v-model="code"
                    ></v-text-field>
                </template>
            </v-hover>

            <v-btn color="blue" class="mt-6 w-100" @click="onConfirmUser" :loading="isLoading.authentication">
                Continue
            </v-btn>

            <div class="text-secondary text-caption mt-4">
                Don't see our email? Check your spam folder, or
                <div class="link button-hover" :class="{ disabled: isLoadingResendEmail }" @click="onResendEmail">
                    resend email
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
    import { onMounted, ref } from 'vue';
    import { useUserStore } from '../stores/user';
    import { RouteName } from '../types/router';
    import { useToast } from 'vue-toastification';
    import { useRoute, useRouter } from 'vue-router';
    import { resendConfirmationEmail } from '../requests';
    import { storeToRefs } from 'pinia';

    const userStore = useUserStore();
    const { isLoading } = storeToRefs(userStore);

    const toast = useToast();

    const router = useRouter();
    const route = useRoute();

    const code = ref<string>();
    const isLoadingResendEmail = ref(false);

    onMounted(() => {
        if (!route.query.email) {
            router.push({ name: RouteName.SIGNUP });
        }
    });

    const onConfirmUser = async () => {
        if (!code.value || code.value.length !== 6) {
            console.log('hi');
            toast.error('Invalid confirmation code');
            return;
        }

        const success = await userStore.confirmUser(route.query.email as string, code.value);

        if (!success) {
            return;
        }

        toast.success('Signup confirmed');
        router.push({ name: RouteName.LOGIN });
    };

    const onResendEmail = async () => {
        if (isLoadingResendEmail.value) {
            return;
        }

        isLoadingResendEmail.value = true;

        await resendConfirmationEmail(route.query.email as string);
        toast.success('Email sent');

        isLoadingResendEmail.value = false;
    };
</script>

<style scoped>
    .msg-container {
        width: 400px;
        margin: auto;
    }

    .field {
        border: 1px solid rgb(var(--v-theme-blue));
    }

    .hovering {
        border-width: 2px;
    }

    .disabled {
        cursor: not-allowed;
    }
</style>
