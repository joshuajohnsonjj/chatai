import { defineStore } from 'pinia';
import {
    confirmNewUser,
    getUserInfo,
    loginUser,
    registerNewUser,
    updateDetails,
    updatePassword,
    updateSettings,
    uploadAvatarToS3,
} from '../requests';
import type { AccountPlan, OrgInfo, UserInfo, UserSettings } from '../types/user-store';
import { UserType } from '../types/user-store';
import { computed, ref } from 'vue';
import omit from 'lodash/omit';
import { TOKEN_STORAGE_KEY } from '../constants/localStorageKeys';
import { UpdateUserDetailRequest } from '../types/requests';
import { HttpStatusCode } from 'axios';

export const useUserStore = defineStore('user', () => {
    const isLoading = ref({
        authentication: false,
        imageUpload: false,
        userInfo: false,
        infoUpdate: false,
        passwordUpdate: false,
        settingsUpdate: false,
    });

    const userData = ref<UserInfo>();

    const userOrgData = ref<OrgInfo>({
        id: null,
        name: null,
        planId: null,
        isAccountActive: null,
    });

    const planData = ref<AccountPlan | null>();

    const userEntityId = computed((): string => {
        if (!userData.value) {
            return '';
        }

        if (userData.value?.type === UserType.ORGANIZATION_MEMBER && userData.value.organizationId) {
            return userData.value.organizationId;
        }

        return userData.value.id;
    });

    const signup = async (firstName: string, lastName: string, email: string, password: string) => {
        isLoading.value.authentication = true;

        try {
            await registerNewUser(firstName, lastName, email, password);
        } finally {
            isLoading.value.authentication = false;
        }
    };

    const confirmUser = async (email: string, code: string): Promise<boolean> => {
        isLoading.value.authentication = true;

        let success = false;

        try {
            await confirmNewUser(email, code);
            success = true;
        } finally {
            isLoading.value.authentication = false;
            return success;
        }
    };

    const login = async (email: string, password: string): Promise<{ success: boolean; unconfirmed: boolean }> => {
        isLoading.value.authentication = true;

        try {
            const resp = await loginUser(email, password);

            if (!resp) {
                isLoading.value.authentication = false;
                return {
                    success: false,
                    unconfirmed: false,
                };
            }

            localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(resp));

            await setCurrentUser();

            isLoading.value.authentication = false;

            return {
                success: true,
                unconfirmed: false,
            };
        } catch (e) {
            isLoading.value.authentication = false;

            if (e.response.data?.error?.code === HttpStatusCode.UnprocessableEntity) {
                return {
                    success: false,
                    unconfirmed: true,
                };
            }

            return {
                success: false,
                unconfirmed: false,
            };
        }
    };

    const setCurrentUser = async () => {
        isLoading.value.userInfo = true;
        const tokenData = JSON.parse(localStorage.getItem(TOKEN_STORAGE_KEY) ?? '{}');

        if (!tokenData.userId) {
            isLoading.value.userInfo = false;
            return;
        }

        const resp = await getUserInfo();

        userData.value = {
            ...omit(resp, ['organization', 'plan']),
            type: resp.type as UserType,
            id: tokenData.userId,
            email: tokenData.email,
        };

        if (resp.organization) {
            userOrgData.value = resp.organization;
        } else {
            planData.value = resp.plan;
        }

        isLoading.value.userInfo = false;
    };

    const setNewProfileImage = async (imageBase64: string, type: string): Promise<{ success: boolean }> => {
        let success = true;

        isLoading.value.imageUpload = true;

        try {
            const resp = await uploadAvatarToS3(imageBase64, type);

            if (resp?.imageUrl) {
                userData.value!.photoUrl = resp.imageUrl;
            } else {
                success = false;
            }
        } catch (e) {
            success = false;
        } finally {
            isLoading.value.imageUpload = false;
        }

        return { success };
    };

    const commitProfileDetailUpdate = async (
        firstName: string,
        lastName: string,
        email: string,
        phoneNumber: string,
    ): Promise<{ success: boolean }> => {
        const accessToken = JSON.parse(localStorage.getItem(TOKEN_STORAGE_KEY) ?? '{}').accessToken as string;

        isLoading.value.infoUpdate = true;

        let success = true;

        const updatePayload: UpdateUserDetailRequest = {
            accessToken,
        };

        if (firstName && firstName !== userData.value?.firstName) updatePayload.firstName = firstName;
        if (lastName && lastName !== userData.value?.lastName) updatePayload.lastName = lastName;
        if (email && email !== userData.value?.email) updatePayload.email = email;
        if (phoneNumber && phoneNumber !== userData.value?.phoneNumber) updatePayload.phoneNumber = phoneNumber;

        try {
            await updateDetails(updatePayload);

            userData.value = {
                ...userData.value!,
                ...omit(updatePayload, ['accessToken']),
            };
        } catch (e) {
            success = false;
            isLoading.value.infoUpdate = false;
        }

        isLoading.value.infoUpdate = false;

        return { success };
    };

    const updateUserPassowrd = async (newPassword: string, oldPassword: string): Promise<{ success: boolean }> => {
        const accessToken = JSON.parse(localStorage.getItem(TOKEN_STORAGE_KEY) ?? '{}').accessToken as string;

        isLoading.value.passwordUpdate = true;

        let success = true;

        try {
            await updatePassword(oldPassword, newPassword, accessToken);
        } catch (e) {
            success = false;
            isLoading.value.passwordUpdate = false;
        }

        isLoading.value.passwordUpdate = false;

        return { success };
    };

    const updateUserSettings = async (updates: Partial<UserSettings>): Promise<{ success: boolean }> => {
        isLoading.value.settingsUpdate = true;

        let success = true;

        try {
            await updateSettings(updates);

            userData.value!.settings = {
                ...userData.value!.settings,
                ...updates,
            };
        } catch (e) {
            success = false;
            isLoading.value.settingsUpdate = false;
        }

        isLoading.value.settingsUpdate = false;

        return { success };
    };

    return {
        userData,
        userOrgData,
        isLoading,
        userEntityId,
        planData,
        login,
        signup,
        confirmUser,
        setCurrentUser,
        setNewProfileImage,
        commitProfileDetailUpdate,
        updateUserPassowrd,
        updateUserSettings,
    };
});
