<template>
    <div class="bg-surface w-100 h-100 rounded-xl px-6 relative">
        <p class="text-h4 font-weight-medium w-100 text-center text-primary pt-14">Start Conversation</p>
        <p class="text-body-2 w-100 text-secondary text-center">
            Gain valuable insights related to your data. Ask me anything.
        </p>

        <div class="mx-auto" style="max-width: 950px">
            <div class="d-flex justify-space-between mt-14">
                <NewChatInfoBlock
                    color="info"
                    icon="mdi-text"
                    title="Examples"
                    :content="[
                        'Started earnest brother believe an exposed so. Me he believing daughters if forfeited.',
                        'Age again and stuff downs spoke. Late hour new nay able fat each sell.',
                        'They why quit gay cold rose deal park. One same they four did ask busy.',
                    ]"
                />
                <NewChatInfoBlock
                    color="success"
                    title="Capabilities"
                    icon="mdi-rocket-launch-outline"
                    :content="[
                        'Started earnest brother believe an exposed so. Me he believing daughters if forfeited.',
                        'Age again and stuff downs spoke. Late hour new nay able fat each sell.',
                        'They why quit gay cold rose deal park. One same they four did ask busy.',
                    ]"
                />
                <NewChatInfoBlock
                    color="warning"
                    title="Limitations"
                    icon="mdi-head-alert-outline"
                    :content="[
                        'Started earnest brother believe an exposed so. Me he believing daughters if forfeited.',
                        'Age again and stuff downs spoke. Late hour new nay able fat each sell.',
                        'They why quit gay cold rose deal park. One same they four did ask busy.',
                    ]"
                />
            </div>

            <MessageInput style="max-width: 800px; left: 50%; transform: translate(-50%, -50%)" />
        </div>
    </div>
</template>

<script lang="ts" setup>
    import { storeToRefs } from 'pinia';
    import { useChatStore } from '../stores/chat';
    import { onBeforeMount } from 'vue';

    const chatStore = useChatStore();
    const { chats } = storeToRefs(chatStore);

    onBeforeMount(async () => {
        if (!chats.value.length) {
            await chatStore.getChatList();
        }
    });
</script>
