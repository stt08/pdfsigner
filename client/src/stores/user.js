import { reactive } from 'vue'

const emptyProfile = {
    name: '',
    email: '',
    role: '',
    certificates: []
};

const user = reactive({
    profile: { ...emptyProfile },
    loggedIn: false,
    loaded: false
});

export {
    user,
    emptyProfile
};