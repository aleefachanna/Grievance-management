import { useState } from "react";
import axios from "axios";
import api from './api'; // Assuming you have an api.js for axios instance
function TrackComplaint() {
  const [complaintId, setComplaintId] = useState("");
  const [complaint, setComplaint] = useState(null);
  const [error, setError] = useState("");

  const handleTrack = async () => {
    try {
      const response = await api.get(`complaint/track/${complaintId}/`); // <-- add 'complaint/'
      setComplaint(response.data);
      setError("");
    } catch (err) {
      setComplaint(null);
      setError("Complaint not found");
    }
  };

  return (
    <div>
      <h2>Track Complaint</h2>

      <input
        type="text"
        placeholder="Enter Complaint ID"
        value={complaintId}
        onChange={(e) => setComplaintId(e.target.value)}
      />

      <button onClick={handleTrack}>Track</button>

      {error && <p>{error}</p>}

      {complaint && (
        <div>
          <h3>Status: {complaint.status}</h3>
          <p>Organisation: {complaint.organisation}</p>
          <p>Severity: {complaint.severity}</p>
          <p>Description: {complaint.description}</p>
          <p>Created: {complaint.created_at}</p>
          <p>Closed: {complaint.closed_at || "Not Closed Yet"}</p>
        </div>
      )}
    </div>
  );
}

export default TrackComplaint;