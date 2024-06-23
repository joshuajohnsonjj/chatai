<template>
    <div class="bg-surface-bright rounded py-2 px-4 d-flex">
        <v-avatar v-if="userData?.photoUrl" :image="userData.photoUrl" size="32"></v-avatar>
        <v-avatar v-else icon="mdi-account-circle" size="32" style="font-size: 2rem"></v-avatar>

        <p v-if="!isEditing" class="ml-4 mt-1 me-auto text-body-1 text-primary">{{ text }}</p>

        <div v-else class="relative ml-4 my-1 w-100">
            <v-textarea variant="solo-filled" v-model="editText"></v-textarea>

            <div id="editActionBtnContainer" class="d-flex justify-end absolute">
                <v-btn class="action-button" @click="onEditCancel">cancel</v-btn>
                <v-btn class="action-button ml-2" color="blue" @click="onEditSent">send</v-btn>
            </div>
        </div>

        <v-btn
            v-if="!isEditing && !!systemResponseId"
            variant="plain"
            color="secondary"
            style="height: 30px; width: 30px"
            @click="isEditing = true"
        >
            <v-icon icon="mdi-square-edit-outline" size="large"></v-icon>
            <v-tooltip text="Edit prompt" activator="parent" location="top"></v-tooltip>
        </v-btn>
    </div>
</template>

<script lang="ts" setup>
    import { ref } from 'vue';
    import { useChatStore } from '../../stores/chat';
    import { useUserStore } from '../../stores/user';
    import { storeToRefs } from 'pinia';

    const props = defineProps<{
        text: string;
        messageId: string;
        systemResponseId?: string;
        threadId: string;
    }>();

    const chatStore = useChatStore();

    const userStore = useUserStore();
    const { userData } = storeToRefs(userStore);

    const isEditing = ref(false);
    const editText = ref(props.text);

    const onEditCancel = () => {
        isEditing.value = false;
        editText.value = props.text;
    };

    const onEditSent = () => {
        isEditing.value = false;

        chatStore.updateMessage(editText.value, props.messageId, props.systemResponseId!, props.threadId);
    };
</script>

<style scoped>
    #editActionBtnContainer {
        bottom: 10px;
        right: 10px;
    }

    .action-button {
        width: 5.5rem;
        border-radius: 2rem;
    }
</style>
