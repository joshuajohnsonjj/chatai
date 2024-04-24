<template>
    <v-app>
        <v-main v-if="$route.name === 'login'">
            <router-view />
        </v-main>
        <v-main class="pt-6 px-4" v-else>
            <v-row class="h-100">
                <v-col cols="3">
                    <SideNav />
                </v-col>
                <v-col cols="9" style="margin-bottom: 0">
                    <router-view />
                </v-col>
            </v-row>
        </v-main>
    </v-app>
</template>
