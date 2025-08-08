import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

import { useLoginMutation } from './store/plantApi';
import { useAppDispatch } from './store';
import { setToken } from './store/authSlice';

const LoginPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || "/";
    const [login, { isLoading }] = useLoginMutation();
    const dispatch = useAppDispatch();

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError('');

        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);

        const promise = login(formData).unwrap();

        toast.promise(promise, {
            loading: 'Logging in...',
            success: (data) => {
                dispatch(setToken(data.access_token));
                navigate(from, { replace: true });
                return 'Successfully logged in!';
            },
            error: 'Failed to login. Please check your credentials.',
        });
    };

    return (
        <div className="container mx-auto p-4">
            <div className="max-w-md mx-auto bg-white p-8 border border-gray-200 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
                            Username
                        </label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                            required
                        />
                    </div>
                    {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
                    <div className="flex items-center justify-between">
                        <button
                            type="submit"
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </div>
                </form>
                <p className="text-center text-gray-500 text-xs mt-4">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-blue-500 hover:text-blue-700">
                        Register
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
