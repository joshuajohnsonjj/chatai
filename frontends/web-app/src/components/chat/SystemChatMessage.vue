<template>
    <div class="d-flex">
        <v-avatar image="@/assets/orb.gif" size="65" class="pt-2" style="margin-left: -5px"></v-avatar>
        <div class="text-body-1 text-primary mt-4 system-message" v-html="markdown(text)"></div>
    </div>

    <div class="d-flex justify-end py-2">
        <v-btn variant="plain" color="secondary" @click="copyToClipboard(text)">
            <v-icon icon=" mdi-content-copy" size="large"></v-icon>
            <v-tooltip text="Copy response" activator="parent" location="top"></v-tooltip>
        </v-btn>
        <v-btn variant="plain" color="secondary" @click="chatStore.setReplyMode(threadId)">
            <v-icon icon=" mdi-chat-outline" size="large"></v-icon>
            <v-tooltip text="Reply in thread" activator="parent" location="top"></v-tooltip>
        </v-btn>
    </div>
</template>

<script lang="ts" setup>
    import { markdown } from '../../utility/markdown';
    import { useChatStore } from '../../stores/chat';
    import { useToast } from 'vue-toastification';

    defineProps<{
        text: string;
        threadId: string;
    }>();

    const chatStore = useChatStore();
    const toast = useToast();

    const copyToClipboard = (copyText: string) => {
        navigator.clipboard.writeText(copyText);
        toast.success('Content coppied to clipboard!');
    };
</script>
