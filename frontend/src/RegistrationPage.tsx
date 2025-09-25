import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { register as authRegister } from './api/authService';
import VersionDisplay from './components/VersionDisplay';

const RegistrationPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsLoading(true);

        try {
            await authRegister({ username, password });
            toast.success('Successfully registered! Please login.');
            navigate('/login');
        } catch (error: any) {
            let errorMessage = 'Failed to register. Please try another username.';
            if (error.response && error.response.data && error.response.data.detail) {
                if (Array.isArray(error.response.data.detail)) {
                    errorMessage = error.response.data.detail.map((d: any) => `${d.loc[1]} ${d.msg}`).join(', ');
                } else {
                    errorMessage = error.response.data.detail;
                }
            }
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-4 bg-background text-foreground">
            <div className="max-w-md mx-auto bg-component-background p-8 border border-border rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-6 text-center">Register</h2>
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
                    <div className="flex items-center justify-between">
                        <button
                            type="submit"
                            className="bg-interactive-primary text-interactive-primary-foreground font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Registering...' : 'Register'}
                        </button>
                    </div>
                </form>
            </div>
            <VersionDisplay />
        </div>
    );
};

export default RegistrationPage;
