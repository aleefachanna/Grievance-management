import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Added for the Home link
import api from './api';

function SubmitComp() {
    const [organisations, setOrganisations] = useState([]);
    const [formData, setFormData] = useState({
        email: '',
        organisation: '',
        description: ''
    });
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false); // Added loading state

    useEffect(() => {
        api.get('submit/')
            .then(res => setOrganisations(res.data))
            .catch(err => console.error("Could not fetch organisations", err));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); // Start loading
        setMessage('');   // Clear old messages

        try {
            const response = await api.post('submit/', formData);
            // MATCHED KEY: complaint_id instead of id
            setMessage(`Complaint submitted! ID: ${response.data.complaint_id}`);
            setFormData({ email: '', organisation: '', description: '' }); 
        } catch (err) {
            setMessage("Error submitting complaint. Please try again.");
        } finally {
            setLoading(false); // Stop loading regardless of success/fail
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg">
            <Link to="/" className="text-blue-500 text-sm hover:underline">← Back to Home</Link>
            <h2 className="text-2xl font-bold mb-6 mt-2">Submit a Grievance</h2>

            {message && (
                <div className={`p-4 mb-4 rounded ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block font-semibold">Your Email</label>
                    <input 
                        type="email" 
                        required 
                        className="w-full border p-2 rounded"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        disabled={loading}
                    />
                </div>

                <div>
                    <label className="block font-semibold">Select Organisation</label>
                    <select 
                        required 
                        className="w-full border p-2 rounded"
                        value={formData.organisation}
                        onChange={(e) => setFormData({...formData, organisation: e.target.value})}
                        disabled={loading}
                    >
                        <option value="">-- Choose --</option>
                        {organisations.map(org => (
                            <option key={org.id} value={org.id}>{org.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block font-semibold">Describe your issue</label>
                    <textarea 
                        rows="5" 
                        required 
                        className="w-full border p-2 rounded"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        disabled={loading}
                    ></textarea>
                </div>

                <button 
                    type="submit" 
                    className={`w-full py-2 rounded font-bold transition text-white ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                    disabled={loading}
                >
                    {loading ? "Processing AI Analysis..." : "Submit Complaint"}
                </button>
            </form>
        </div>
    );
}

export default SubmitComp;