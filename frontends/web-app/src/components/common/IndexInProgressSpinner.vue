<template>
    <v-tooltip text="Indexing in progress" location="top" max-width="300">
        <template v-slot:activator="{ props }">
            <v-icon class="spining" icon="mdi-sync" size="large" color="info" v-bind="props"></v-icon>
        </template>
    </v-tooltip>
</template>
