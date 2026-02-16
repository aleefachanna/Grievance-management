import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
            <h1 className="text-4xl font-bold mb-8 text-blue-900">Grievance Management System</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Public Path */}
                <div className="p-8 bg-white shadow-lg rounded-xl text-center border-t-4 border-blue-600">
                    <h2 className="text-xl font-semibold mb-4">Citizens</h2>
                    <p className="text-gray-600 mb-6">File a new complaint and get AI-powered severity analysis.</p>
                    <Link to="/submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
                        Submit Complaint
                    </Link>
                </div>

                {/* Employee Path */}
                <div className="p-8 bg-white shadow-lg rounded-xl text-center border-t-4 border-green-600">
                    <h2 className="text-xl font-semibold mb-4">Department Staff</h2>
                    <p className="text-gray-600 mb-6">Login to manage complaints, assign work, and view AI reports.</p>
                    <Link to="/login" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition">
                        Department Login
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default Home;