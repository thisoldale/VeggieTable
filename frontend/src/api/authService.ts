import axios from 'axios';
import { LoginCredentials, RegistrationData } from '../types';

const API_URL = '/api';

export const login = async (credentials: LoginCredentials) => {
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const response = await axios.post(`${API_URL}/token`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const register = async (userData: RegistrationData) => {
    const response = await axios.post(`${API_URL}/users/`, userData, {
        headers: {
            'Content-Type': 'application/json',
        },
    });
    return response.data;
};