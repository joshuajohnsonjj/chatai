import { defineStore } from 'pinia';
import { getUserInfo, loginUser, uploadAvatarToS3 } from '../requests';
import { AccountPlan, OrgInfo, UserInfo, UserType } from '../types/user-store';
import { computed, ref } from 'vue';
import { omit } from 'lodash';
import { TOKEN_STORAGE_KEY } from '../constants';

export const useUserStore = defineStore('user', () => {
    const isLoading = ref({
        authentication: false,
        imageUpload: false,
        userInfo: false,
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

    const login = async (email: string, password: string): Promise<boolean> => {
        isLoading.value.authentication = true;
        const resp = await loginUser(email, password);

        if (!resp) {
            isLoading.value.authentication = false;
            return false;
        }

        localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(resp));

        await setCurrentUser();

        isLoading.value.authentication = false;
        return true;
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

        const resp = await uploadAvatarToS3(imageBase64, type);

        if (resp?.imageUrl) {
            userData.value!.photoUrl = resp.imageUrl;
        } else {
            success = false;
        }

        isLoading.value.imageUpload = false;

        return { success };
    };

    return {
        userData,
        userOrgData,
        isLoading,
        userEntityId,
        planData,
        login,
        setCurrentUser,
        setNewProfileImage,
    };
});
