import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Check if user is already logged in on page refresh
        const token = localStorage.getItem('access_token');
        const name = localStorage.getItem('employee_name');
        if (token && name) {
            setUser({ name });
        }
        setLoading(false);
    }, []);

    const logout = () => {
        localStorage.clear();
        setUser(null);
        navigate('/employee/login');
    };

    return (
        <AuthContext.Provider value={{ user, setUser, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);