import axios from 'axios';

// Create an axios instance
const api = axios.create({
    baseURL: '/api',
});


export default api;