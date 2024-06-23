<template>
    <div class="rounded pa-4 mt-2" :class="{ 'bg-surface': !miniMode, 'large-container': !miniMode }">
        <div class="d-flex justify-space-between">
            <div class="d-flex justify-start" :class="miniMode ? 'mx-auto' : 'mb-4'">
                <v-avatar v-if="userData?.photoUrl" :image="userData.photoUrl" size="49"></v-avatar>
                <v-avatar v-else icon="mdi-account-circle" size="49" style="font-size: 2.25rem"></v-avatar>
                <div v-if="!miniMode" class="ml-2">
                    <div class="d-flex justify-space-between">
                        <p class="text-body-1 text-primary font-weight-medium">
                            {{ `${userData?.firstName} ${userData?.lastName}` }}
                        </p>
                    </div>
                    <p class="text-caption text-secondary">{{ email }}</p>
                </div>
            </div>
        </div>

        <v-btn
            v-if="!miniMode"
            variant="text"
            density="compact"
            class="text-body-1"
            prepend-icon="mdi-logout"
            color="secondary"
            @click="onLogout"
        >
            Log out
        </v-btn>
    </div>
</template>

<script lang="ts" setup>
    import { storeToRefs } from 'pinia';
    import { useUserStore } from '../../stores/user';
    import { TOKEN_STORAGE_KEY } from '../../constants/localStorageKeys';

    defineProps<{
        miniMode: boolean;
    }>();

    const userStore = useUserStore();
    const { userData } = storeToRefs(userStore);

    const email = JSON.parse(localStorage.getItem(TOKEN_STORAGE_KEY) ?? '{}')?.email;

    const onLogout = () => {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        window.location.href = '/login';
    };
</script>

<style scoped>
    .large-container {
        width: 280px;
    }
</style>
