import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import api from './api'; // Assuming you have an api.js for axios instance
function OrgView() {
  const { slug } = useParams();
  const [org, setOrg] = useState(null);

  useEffect(() => {
    api
      .get(`organisation/${slug}/`)
      .then((res) => setOrg(res.data))
      .catch((err) => console.error(err));
  }, [slug]);

  if (!org) return <div className="p-10">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-10">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-2xl p-8">
        {org.logo && (
          <img
            src={`http://127.0.0.1:8000${org.logo}`}
            alt="Logo"
            className="w-32 mb-4"
          />
        )}

        <h1 className="text-3xl font-bold text-gray-800 mb-3">
          {org.name}
        </h1>

        <p className="text-gray-600 mb-4">{org.description}</p>

        <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <strong>Type:</strong> {org.organisation_type}
          </div>
          <div>
            <strong>Location:</strong> {org.city}, {org.state}, {org.country}
          </div>
          <div>
            <strong>Email:</strong> {org.official_email}
          </div>
          <div>
            <strong>Website:</strong> {org.website}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrgView;