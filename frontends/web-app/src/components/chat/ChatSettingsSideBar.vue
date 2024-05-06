<template>
    <div id="chat-settings-container" class="pt-6 pl-6">
        <div class="text-primary text-h6">Configuration</div>

        <v-slider></v-slider>
        <v-slider></v-slider>
        <v-switch label="Switch"></v-switch>
    </div>
</template>

<style scoped>
    #chat-settings-container {
        margin-top: 5rem;
        height: 85vh;
        width: 250px;
        margin-left: 1rem;
        border-left: 1px solid rgb(var(--v-theme-border-color));
    }
</style>
