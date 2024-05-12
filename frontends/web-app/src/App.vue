<template>
    <v-app>
        <v-main v-if="!$route.meta?.sideNavEnabled">
            <router-view />
        </v-main>
        <v-main class="pa-4" v-else>
            <div class="h-100 d-flex justify-start">
                <div class="">
                    <SideNav />
                </div>
                <div class="w-100">
                    <router-view />
                </div>
            </div>
        </v-main>
    </v-app>
</template>
