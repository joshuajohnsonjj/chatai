<script lang="ts" setup>
    //
</script>

<template>
    <v-container>
        <v-row class="py-12">
            <v-col cols="6">
                <div class="text-h3 font-weight-thin text-primary">Apoio</div>
            </v-col>
            <v-col cols="6">
                <div class="text-h5 font-weight-medium text-primary">Welcome back!</div>
                <div class="text-subtitle-1 text-secondary mb-6">Please login to your account</div>

                <div class="text-label text-primary mb-1">Email</div>
                <v-text-field variant="solo-filled" type="email" placeholder="john.doe@domain.com"></v-text-field>
                <div class="text-label text-primary mb-1">Password</div>
                <v-text-field variant="solo-filled" type="password" placeholder="****************"></v-text-field>
                <div class="d-flex justify-space-between">
                    <v-checkbox class="text-caption" label="Remember me"></v-checkbox>
                    <v-btn class="text-caption mt-2" variant="text">Forgot password?</v-btn>
                </div>

                <div class="w-100 px-5 rounded d-flex justify-space-between login-button mb-12">
                    <p class="line-height-60">Log in to Apoio</p>
                    <v-icon class="line-height-60" style="height: 60px;" icon="mdi-arrow-right"></v-icon>
                </div>

                <HorizontalLine with-text="or" />

                <div class="w-100 mt-12 pa-1 rounded login-button">
                    <div class="bg-background w-100 d-flex justify-start rounded px-5">
                        <v-icon class="line-height-60" style="height: 60px;" icon="mdi-google"></v-icon>
                        <p class="pl-4 line-height-60">Log in with Google</p>
                    </div>
                </div>
            </v-col>
        </v-row>
    </v-container>
</template>

<style>
.v-input__details {
    display: none;
}
</style>

<style scoped>
.login-button {
    background: rgb(var(--v-theme-gradient-purple));
    background: linear-gradient(90deg, rgba(var(--v-theme-gradient-purple), 1) 0%, rgba(var(--v-theme-gradient-blue), 1));
}

.line-height-60 {
    line-height: 60px;
}
</style>