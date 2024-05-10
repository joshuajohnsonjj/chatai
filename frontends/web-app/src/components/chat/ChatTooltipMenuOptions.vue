<template>
    <div>
        <v-btn variant="text" @click="openChatSettings">Chat Settings</v-btn>
    </div>
    <div>
        <v-btn
            v-if="!selectedChat.isArchived"
            variant="text"
            @click="
                $emit('openArchiveModal');
                hideAllPoppers();
            "
            >Archive Chat</v-btn
        >
        <v-btn v-else variant="text" @click="unArchive">Unarchive Chat</v-btn>
    </div>
</template>

<script lang="ts" setup>
    import { useRouter } from 'vue-router';
    import { hideAllPoppers } from 'floating-vue';
    import { useChatStore } from '../../stores/chat';
    import { storeToRefs } from 'pinia';

    const chatStore = useChatStore();
    const { selectedChat } = storeToRefs(chatStore);

    const router = useRouter();

    defineEmits(['openArchiveModal']);

    const openChatSettings = () => {
        router.push('?settings=true');
    };

    const unArchive = async () => {
        hideAllPoppers();
        await chatStore.updateChat(selectedChat.value!.id, { isArchived: false });
    };
</script>
