<template>
    <div class="rounded pa-4 mt-2" :class="{ 'bg-surface': !miniMode }">
        <div class="d-flex justify-space-between">
            <div class="d-flex justify-start" :class="miniMode ? 'mx-auto' : 'mb-4'">
                <v-avatar image="@/assets/avatar.jpg" size="49"></v-avatar>
                <div v-if="!miniMode" class="ml-2">
                    <p class="text-body-1 text-primary font-weight-medium">
                        {{ `${userData.firstName} ${userData.lastName}` }}
                    </p>
                    <p class="text-caption text-secondary">{{ email }}</p>
                </div>
            </div>

            <div v-if="!miniMode" class="bg-success rounded align-self-start text-caption px-2">Free</div>
        </div>

        <v-btn v-if="!miniMode" variant="outlined" class="text-caption w-100">Upgrade to Pro</v-btn>
    </div>
</template>

<script lang="ts" setup>
    import { storeToRefs } from 'pinia';
    import { useUserStore } from '../../stores/user';

    defineProps<{
        miniMode: boolean;
    }>();

    const userStore = useUserStore();
    const { userData } = storeToRefs(userStore);

    const email = JSON.parse(localStorage.getItem('chatai:token') ?? '{}')?.email;
</script>
