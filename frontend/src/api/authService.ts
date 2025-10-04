import api from './api';
import { LoginCredentials, RegistrationData } from '../types';

export const login = async (credentials: LoginCredentials) => {
    const params = new URLSearchParams();
    params.append('username', credentials.username);
    params.append('password', credentials.password);

    const response = await api.post('/token', params, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    });
    return response.data;
};

export const register = async (userData: RegistrationData) => {
    const response = await api.post('/users/', userData, {
        headers: {
            'Content-Type': 'application/json',
        },
    });
    return response.data;
};