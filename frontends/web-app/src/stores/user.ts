import { defineStore } from 'pinia';
import { getUserInfo, loginUser } from '../requests';
import { OrgInfo, UserInfo, UserType } from '../types/user-store';
import { ref } from 'vue';
import { omit } from 'lodash';
import { TOKEN_STORAGE_KEY } from '../constants';

export const useUserStore = defineStore('user', () => {
    const isLoading = ref(false);

    const userData = ref<UserInfo>();

    const userOrgData = ref<OrgInfo>({
        id: null,
        name: null,
        planId: null,
        isAccountActive: null,
    });

    const login = async (email: string, password: string): Promise<boolean> => {
        isLoading.value = true;
        const resp = await loginUser(email, password);

        if (!resp) {
            isLoading.value = false;
            return false;
        }

        localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(resp));

        await setCurrentUser();

        isLoading.value = false;
        return true;
    };

    const setCurrentUser = async () => {
        isLoading.value = true;
        const tokenData = JSON.parse(localStorage.getItem(TOKEN_STORAGE_KEY) ?? '{}');

        if (!tokenData.userId) {
            isLoading.value = false;
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
        }

        isLoading.value = false;
    };

    return {
        userData,
        userOrgData,
        isLoading,
        login,
        setCurrentUser,
    };
});
