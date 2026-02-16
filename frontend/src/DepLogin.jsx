import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import this!
import api from './api';

function DepLogin() {
    const [credentials, setCredentials] = useState({ Dep_id: '', Emp_id: '' });
    const navigate = useNavigate(); // Initialize the navigator

    const handleLogin = async () => {
        try {
            // Ensure the keys match exactly what your Django View expects (Dep_id, Emp_id)
            const res = await api.post('emplogin/', credentials);
            
            localStorage.setItem('access_token', res.data.access);
            localStorage.setItem('refresh_token', res.data.refresh);
            
            // Redirect using React Router instead of refreshing the whole browser
            navigate('/depdashboard'); 
        } catch (err) {
            console.error(err);
            alert("Invalid Department ID or Employee ID.");
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <div className="p-8 bg-white shadow-md rounded-lg w-96">
                <h2 className="text-2xl font-bold mb-6 text-center">Department Login</h2>
                
                <div className="space-y-4">
                    <input 
                        className="w-full p-2 border rounded"
                        placeholder="Department ID" 
                        onChange={e => setCredentials({...credentials, Dep_id: e.target.value})} 
                    />
                    <input 
                        className="w-full p-2 border rounded"
                        type="password"
                        placeholder="Employee ID" 
                        onChange={e => setCredentials({...credentials, Emp_id: e.target.value})} 
                    />
                    <button 
                        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-bold"
                        onClick={handleLogin}
                    >
                        Login
                    </button>
                </div>
            </div>
        </div>
    );
}

export default DepLogin;