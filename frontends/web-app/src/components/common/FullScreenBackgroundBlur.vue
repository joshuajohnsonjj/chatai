<template>
    <div id="fullScreenBackgroundblur" class="w-100 h-100"></div>
</template>

<style scoped>
    #fullScreenBackgroundblur {
        position: fixed;
        top: 0;
        left: 0;
        background-color: rgba(var(--v-theme-background), 0.35);
        backdrop-filter: blur(3px);
        z-index: 99;
    }
</style>
