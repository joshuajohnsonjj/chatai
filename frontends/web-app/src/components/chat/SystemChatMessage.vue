<template>
    <div class="d-flex">
        <v-avatar image="@/assets/orb.gif" size="65" class="pt-2" style="margin-left: -5px"></v-avatar>
        <div class="text-body-1 text-primary mt-4 system-message" v-html="markdown(text)"></div>
    </div>

    <div v-if="isInformersVisible" class="d-flex justify-start py-4 ml-15">
        <div v-for="informer in informers" :key="informer.id">
            <div class="px-4 grow-hover" @click="openSource(informer.url)">
                <div class="d-flex justify-center">
                    <v-avatar :image="`${BASE_S3_DATASOURCE_LOGO_URL}${informer.sourceName}.png`" size="40"></v-avatar>
                </div>
                <p class="text-body-2 text-primary text-center mt-2">
                    {{ informerDisplayTitle(informer.name, informer.sourceName) }}
                </p>
            </div>
        </div>
    </div>

    <div class="py-2 d-flex justify-space-between">
        <div class="d-flex justify-start">
            <div class="button-hover message-option" @click="onBadResponse">
                <v-icon icon=" mdi-thumb-down-outline" size="large"></v-icon>
                <v-tooltip text="Mark bad response" activator="parent" location="top"></v-tooltip>
            </div>
            <div class="button-hover message-option" @click="onGoodResponse">
                <v-icon icon=" mdi-thumb-up-outline" size="large"></v-icon>
                <v-tooltip text="Mark great response" activator="parent" location="top"></v-tooltip>
            </div>
        </div>
        <div class="d-flex justify-end">
            <div
                v-if="expandedThreads.includes(threadId) && replyingInThreadId !== threadId"
                class="button-hover message-option"
                @click="onCondenseThread"
            >
                <v-icon icon="mdi-arrow-collapse" size="large"></v-icon>
                <v-tooltip text="Condense thread" activator="parent" location="top"></v-tooltip>
            </div>
            <div class="button-hover message-option" @click="onCopyToClipboard(text)">
                <v-icon icon="mdi-content-copy" size="large"></v-icon>
                <v-tooltip text="Copy response" activator="parent" location="top"></v-tooltip>
            </div>
            <div
                v-if="informers.length"
                class="button-hover message-option"
                @click="isInformersVisible = !isInformersVisible"
            >
                <v-icon :icon="isInformersVisible ? 'mdi-eye-off-outline' : 'mdi-eye-outline'" size="large"></v-icon>
                <v-tooltip
                    :text="isInformersVisible ? 'Hide sources' : 'Show sources'"
                    activator="parent"
                    location="top"
                ></v-tooltip>
            </div>
            <div v-if="!replyingInThreadId" class="button-hover message-option" @click="onReplyInThread">
                <v-icon icon=" mdi-chat-outline" size="large"></v-icon>
                <v-tooltip text="Reply in thread" activator="parent" location="top"></v-tooltip>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
    import { markdown } from '../../utility/markdown';
    import { useChatStore } from '../../stores/chat';
    import { useToast } from 'vue-toastification';
    import { ChatMessageInformer } from '../../types/responses';
    import { ref } from 'vue';
    import { BASE_S3_DATASOURCE_LOGO_URL } from '../../constants';
    import { formatStringStartCase, maxStrLenToElipse } from '../../utility';
    import { storeToRefs } from 'pinia';

    const props = defineProps<{
        text: string;
        threadId: string;
        messageId: string;
        informers: ChatMessageInformer[];
        hasHiddenMessages: boolean;
    }>();

    const chatStore = useChatStore();
    const { expandedThreads, replyingInThreadId } = storeToRefs(chatStore);

    const toast = useToast();

    const isInformersVisible = ref(false);

    const onCopyToClipboard = (copyText: string) => {
        navigator.clipboard.writeText(copyText);
        toast.success('Content coppied to clipboard!');
    };

    const onCondenseThread = () => {
        chatStore.condenseThread(props.threadId);
    };

    const onBadResponse = () => {
        toast.warning('Sorry about that. Thanks for your feedback');
    };

    const onGoodResponse = () => {
        toast.success('Thanks for your feedback!');
    };

    const onReplyInThread = async () => {
        if (props.hasHiddenMessages) {
            await chatStore.retrieveFullThread(props.threadId);
        }

        chatStore.setReplyMode(props.threadId);
    };

    const openSource = (url: string) => {
        window.open(url, '_blank')!.focus();
    };

    const informerDisplayTitle = (title: string, dataSourceName: string): string => {
        if (title && title.length) {
            return maxStrLenToElipse(title, 22);
        }
        return `${formatStringStartCase(dataSourceName)} Data`;
    };
</script>

<style scoped>
    .message-option {
        color: rgb(var(--v-theme-secondary));
        font-size: 0.75rem;
        margin: 0 0.5rem 0.15rem 0;
    }
</style>
