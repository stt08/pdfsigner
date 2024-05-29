import axios from 'axios';

const endpoint = '/api/users';

export default class UserService {
    static async login(email, password) {
        try {
            const response = await axios.post(`${endpoint}/login`, {
                email: email,
                password: password
            });
            return response;
        } catch (error) {
            return error.response;
        }
    }

    static async logout() {
        const response = await axios.post(`${endpoint}/logout`);
        return response.data;
    }

    static async register(fullName, email, password) {
        try {
            const response = await axios.post(`${endpoint}/register`, { fullName, email, password });
            return response.data;
        } catch (error) {
            return error.response.data;
        }
    }

    static async getProfile() {
        const response = await axios.get(`${endpoint}/me`);
        return response.data;
    }

    static async getUsers() {
        const response = await axios.get(`${endpoint}`);
        return response.data;
    }

    static async getUser(id) {
        const response = await axios.get(`${endpoint}/${id}`);
        return response.data;
    }

    static async updateUser(id, field, data) {
        const response = await axios.post(`${endpoint}/${id}`, { data, field });
        return response.data;
    }

    static async updateMe(field, data) {
        const response = await axios.post(`${endpoint}/me`, { data, field });
        return response.data;
    }

    static async deleteUser(id) {
        const response = await axios.delete(`${endpoint}/${id}`);
        return response.data;
    }

    static async createUser(email, fullName, password, role) {
        const response = await axios.post(`${endpoint}`, { email, fullName, password, role });
        return response.data;
    }

    static async deleteMe() {
        const response = await axios.delete(`${endpoint}/me`);
        return response.data;
    }
};