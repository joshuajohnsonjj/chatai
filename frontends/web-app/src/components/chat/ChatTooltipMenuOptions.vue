<template>
    <div>
        <v-btn variant="text" @click="openChatSettings">Chat Settings</v-btn>
    </div>
    <div>
        <v-btn variant="text">Archive Chat</v-btn>
    </div>
</template>

<script lang="ts" setup>
    import { useRouter } from 'vue-router';

    const router = useRouter();

    function openChatSettings() {
        router.push('?settings=true');
    }
</script>
