<template>
    <div class="bg-surface w-100 h-100 rounded-xl">
        <div class="w-100 bottom-border-primary px-6 py-6 pb-4">
            <p class="text-h4 font-weight-medium text-primary">Profile</p>
            <p class="text-body-1 text-primary">Update your profile</p>
        </div>

        <div style="max-height: 82.5vh; overflow-y: scroll">
            <v-row class="border-primary rounded pa-6 ma-8">
                <v-col cols="3">
                    <div class="text-h6 font-weight-medium text-primary">Profile photo</div>
                    <div class="text-body-2 text-secondary">This image will be displayed on your profile.</div>
                </v-col>
                <v-col cols="9">
                    <div class="border-primary rounded pa-6 bg-surface-bright" style="height: 200px">IMAGE DROPPER</div>
                </v-col>
            </v-row>

            <v-row class="border-primary rounded pa-6 ma-8">
                <v-col cols="3">
                    <div class="text-h6 font-weight-medium text-primary">Details</div>
                    <div class="text-body-2 text-secondary">Update your personal details here.</div>
                </v-col>
                <v-col cols="9">
                    <div class="border-primary rounded pa-6 bg-surface-bright">
                        <div class="d-flex justify-space-between">
                            <div class="w-50 mr-2">
                                <div class="text-body-2 text-primary">First name</div>
                                <v-text-field
                                    prepend-inner-icon="mdi-account"
                                    density="compact"
                                    variant="outlined"
                                ></v-text-field>
                            </div>
                            <div class="w-50 ml-2">
                                <div class="text-body-2 text-primary">Last name</div>
                                <v-text-field
                                    density="compact"
                                    prepend-inner-icon="mdi-account"
                                    variant="outlined"
                                ></v-text-field>
                            </div>
                        </div>

                        <div class="w-100 mt-4">
                            <div class="text-body-2 text-primary">Email</div>
                            <v-text-field
                                prepend-inner-icon="mdi-email"
                                density="compact"
                                variant="outlined"
                                type="email"
                            ></v-text-field>
                        </div>

                        <div class="w-100 mt-4">
                            <div class="text-body-2 text-primary">Phone number</div>
                            <v-text-field
                                prepend-inner-icon="mdi-phone"
                                density="compact"
                                variant="outlined"
                                type="phone"
                            ></v-text-field>
                        </div>
                    </div>
                </v-col>
            </v-row>

            <v-row class="border-primary rounded pa-6 ma-8">
                <v-col cols="3">
                    <div class="text-h6 font-weight-medium text-primary">Security</div>
                    <div class="text-body-2 text-secondary">Update authentication and security preferences here.</div>
                </v-col>
                <v-col cols="9">
                    <div class="border-primary rounded pa-6 bg-surface-bright">
                        <div class="w-100 mt-4">
                            <div class="text-body-2 text-primary">Current password</div>
                            <v-text-field
                                prepend-inner-icon="mdi-lock"
                                density="compact"
                                variant="outlined"
                                type="password"
                            ></v-text-field>
                        </div>

                        <div class="w-100 mt-4">
                            <div class="text-body-2 text-primary">New password</div>
                            <v-text-field
                                prepend-inner-icon="mdi-lock"
                                density="compact"
                                variant="outlined"
                                type="password"
                            ></v-text-field>
                        </div>

                        <div class="mt-5">MFA Enabled/Disabled</div>
                    </div>
                </v-col>
            </v-row>
        </div>
    </div>
</template>
