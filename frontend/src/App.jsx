import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './Home'; // New Import
import Login from './Login';
import Dashboard from './Dashboard';
import SubmitForm from './SubmitForm';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('access_token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* The Landing Page */}
        <Route path="/" element={<Home />} />
        
        {/* Public Submit Page */}
        <Route path="/submit" element={<SubmitForm />} />
        
        {/* Login Page */}
        <Route path="/login" element={<Login />} />
        
        {/* Protected Dashboard - Redirects to login if not authenticated */}
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;