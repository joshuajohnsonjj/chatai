<script lang="ts" setup>
const menuOptions = [
    {
        title: 'Chats',
        icon: 'mdi-message-text-outline',
        color: 'blue',
    },
    {
        title: 'Search',
        icon: 'mdi-magnify',
        color: 'success',
    },
    {
        title: 'Integrations',
        icon: 'mdi-cloud-outline',
        color: 'pink',
    },
    {
        title: 'Help & support',
        icon: 'mdi-lifebuoy',
        color: 'warning',
    },
    {
        title: 'Settings',
        icon: 'mdi-cog-outline',
        color: 'info',
    },
];

const selectedMenuOption = 'Chats';

const chatOptions = [
    {
        title: 'Code Guidelines',
        color: 'gray',
    },
    {
        title: 'Special Project',
        color: 'info',
    },
    {
        title: 'Q1 Financials',
        color: 'blue',
    },
    {
        title: 'Archived',
        color: 'warning',
    },
];

const selectedChatOption = 'Special Project';
</script>


<template>
    <div class="d-flex justify-space-between">
        <div class="text-h4 font-weight-thin text-primary">Apoio</div>
        <NavOpenClose style="width: 25px;" />
    </div>
    
    <div class="mt-6">
        <div 
            v-for="option in menuOptions" 
            :key="option.title"
            class="d-flex justify-start px-4 rounded mb-3"
            :class="{ selected: selectedMenuOption === option.title }"
        >
            <v-icon :icon="option.icon" :color="option.color" style="height: 45px;"></v-icon>
            <p class="pl-4 text-paragraph text-primary" style="line-height: 45px;">{{ option.title }}</p>
        </div>

        <HorizontalLine />

        <p class="mt-3 text-paragraph text-secondary">Chat list</p>

        <div 
            v-for="option in chatOptions" 
            :key="option.title"
            class="d-flex justify-start px-4 rounded mt-2"
            :class="{ selectedChat: selectedChatOption === option.title }"
        >
            <div class="chat-square" :class="`bg-${option.color}`"></div>
            <p class="pl-4 text-paragraph text-primary" style="line-height: 40px;">{{ option.title }}</p>
        </div>

        <UserAvatar />
    </div>
</template>

<style scoped>
.selected {
    background-color: rgb(var(--v-theme-surface-bright));
}

.selectedChat {
    background: linear-gradient(90deg, rgba(var(--v-theme-gradient-purple), 1) 0%, rgba(var(--v-theme-surface-bright), 1));
}

.chat-square {
    height: 15px;
    width: 15px;
    margin-top: 13px;
    background-color: blue;
}
</style>