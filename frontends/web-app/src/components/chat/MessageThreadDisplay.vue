<template>
    <div class="bg-background rounded px-6 pt-6">
        <div v-for="message in threadContent.messages" :key="message.id">
            <div v-if="!message.isSystemMessage" class="bg-surface-bright rounded py-2 px-4 d-flex">
                <v-avatar image="@/assets/avatar.jpg" size="32"></v-avatar>
                <p class="ml-4 mt-1 me-auto text-body-1 text-primary">{{ message.text }}</p>
                <v-tooltip text="Edit prompt" location="top">
                    <template v-slot:activator="{ props }">
                        <v-btn
                            variant="plain"
                            icon="mdi-square-edit-outline"
                            color="secondary"
                            style="height: 30px; width: 30px"
                            v-bind="props"
                        ></v-btn>
                    </template>
                </v-tooltip>
            </div>
            <div v-else>
                <div class="d-flex">
                    <v-avatar image="@/assets/orb.gif" size="65" class="pt-2" style="margin-left: -5px"></v-avatar>
                    <div class="text-body-1 text-primary mt-4 system-message" v-html="markdown(message.text)"></div>
                </div>

                <div class="d-flex justify-end">
                    <v-tooltip text="Copy response" location="top">
                        <template v-slot:activator="{ props }">
                            <v-btn
                                variant="plain"
                                color="secondary"
                                icon="mdi-content-copy"
                                v-bind="props"
                                @click="copyToClipboard(message.text)"
                            ></v-btn>
                        </template>
                    </v-tooltip>
                    <v-tooltip text="Reply in thread" location="top">
                        <template v-slot:activator="{ props }">
                            <v-btn
                                v-if="message.id === last(threadContent.messages).id"
                                variant="plain"
                                color="secondary"
                                icon="mdi-chat-outline"
                                v-bind="props"
                                @click="chatStore.setReplyMode(threadContent.threadId)"
                            ></v-btn>
                        </template>
                    </v-tooltip>
                </div>
            </div>
        </div>

        <div v-if="pendingThreadResponseId === threadContent.threadId" class="mt-2 py-2">
            <v-skeleton-loader type="sentences" color="background" :elevation="1"></v-skeleton-loader>
        </div>
    </div>
</template>

<script lang="ts" setup>
    import last from 'lodash/last';
    import { markdown } from '../../utility/markdown';
    import { storeToRefs } from 'pinia';
    import { useChatStore } from '../../stores/chat';
    import { useToast } from 'vue-toastification';
    import { ChatThreadResponse } from '../../types/responses';

    defineProps<{
        threadContent: ChatThreadResponse;
    }>();

    const chatStore = useChatStore();
    const toast = useToast();

    const { pendingThreadResponseId } = storeToRefs(chatStore);

    const copyToClipboard = (copyText: string) => {
        navigator.clipboard.writeText(copyText);
        toast.success('Content coppied to clipboard!');
    };
</script>
