import axios from 'axios';
import { LoginCredentials, RegistrationData } from '../types';

const API_URL = '/api';

export const login = async (credentials: LoginCredentials) => {
    const params = new URLSearchParams();
    params.append('username', credentials.username);
    params.append('password', credentials.password);

    const response = await axios.post(`${API_URL}/token`, params, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
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