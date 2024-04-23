<template>
    <v-app>
        <v-main v-if="$route.name === 'login'">
            <router-view />
        </v-main>
        <v-main class="py-6 px-4" v-else>
            <v-row>
                <v-col cols="3">
                    <SideNav />
                </v-col>
                <v-col cols="9">
                    <router-view />
                </v-col>
            </v-row>
        </v-main>
    </v-app>
</template>

<script lang="ts" setup>

    //
</script>
