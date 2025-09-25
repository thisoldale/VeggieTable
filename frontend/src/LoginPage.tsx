
import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import { login as authLogin } from './api/authService';
import VersionDisplay from './components/VersionDisplay';

const LoginPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { login: contextLogin } = useAuth();

    const from = location.state?.from?.pathname || "/";

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsLoading(true);

        try {
            const { access_token } = await authLogin({ username, password });

            toast.promise(
                contextLogin(access_token),
                {
                    loading: 'Logging in...',
                    success: () => {
                        navigate(from, { replace: true });
                        return 'Successfully logged in!';
                    },
                    error: 'Failed to update authentication state.',
                }
            );
        } catch (error) {
            toast.error('Failed to login. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-4 bg-background text-foreground">
            <div className="max-w-md mx-auto bg-component-background p-8 border border-border rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-muted-foreground text-sm font-bold mb-2" htmlFor="username">
                            Username
                        </label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="shadow appearance-none border border-border rounded w-full py-2 px-3 bg-component-background leading-tight focus:outline-none focus:ring-2 focus:ring-ring"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-muted-foreground text-sm font-bold mb-2" htmlFor="password">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="shadow appearance-none border border-border rounded w-full py-2 px-3 bg-component-background mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-ring"
                            required
                        />
                    </div>
                    <div className="flex items-center justify-between mb-4">
                        <button
                            type="submit"
                            className="bg-interactive-primary text-interactive-primary-foreground font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Signing In...' : 'Sign In'}
                        </button>
                        <Link to="/register" className="inline-block align-baseline font-bold text-sm text-interactive-primary hover:underline">
                            Register
                        </Link>
                    </div>
                </form>
                <p className="text-center text-gray-500 text-xs mt-4">
                    Don't have an account?{' '}
                    <a href="/register" className="text-blue-500 hover:text-blue-800">
                        Register
                    </a>
                </p>
            </div>
            <VersionDisplay />
        </div>
    );
};

export default LoginPage;
