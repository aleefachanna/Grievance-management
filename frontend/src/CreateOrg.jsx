import { useState } from "react";
import axios from "axios";

function CreateOrg() {
  const [formData, setFormData] = useState({
    name: "",
    organisation_type: "",
    description: "",
    official_email: "",
    contact_phone: "",
    website: "",
    city: "",
    state: "",
    country: "",
  });

  const [logo, setLogo] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();

    for (let key in formData) {
      data.append(key, formData[key]);
    }

    if (logo) {
      data.append("logo", logo);
    }

    try {
      await axios.post(
        "http://127.0.0.1:8000/org/create/",
        data,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      alert("Organisation Created Successfully!");
    } catch (error) {
      console.error(error.response?.data);
      alert("Error creating organisation");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-10">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          Create New Organisation
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">

          <input
            type="text"
            name="name"
            placeholder="Organisation Name"
            className="border p-2 rounded-lg col-span-2"
            onChange={handleChange}
            required
          />

          <select
            name="organisation_type"
            className="border p-2 rounded-lg"
            onChange={handleChange}
            required
          >
            <option value="">Select Type</option>
            <option value="private">Private</option>
            <option value="government">Government</option>
            <option value="ngo">NGO</option>
            <option value="educational">Educational</option>
          </select>

          <input
            type="email"
            name="official_email"
            placeholder="Official Email"
            className="border p-2 rounded-lg"
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="contact_phone"
            placeholder="Contact Phone"
            className="border p-2 rounded-lg"
            onChange={handleChange}
          />

          <input
            type="url"
            name="website"
            placeholder="Website"
            className="border p-2 rounded-lg"
            onChange={handleChange}
          />

          <input
            type="text"
            name="city"
            placeholder="City"
            className="border p-2 rounded-lg"
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="state"
            placeholder="State"
            className="border p-2 rounded-lg"
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="country"
            placeholder="Country"
            className="border p-2 rounded-lg"
            onChange={handleChange}
            required
          />

          <textarea
            name="description"
            placeholder="Organisation Description"
            className="border p-2 rounded-lg col-span-2"
            rows="3"
            onChange={handleChange}
          />

          <div className="col-span-2">
            <label className="block text-sm mb-1">Upload Logo</label>
            <input
              type="file"
              onChange={(e) => setLogo(e.target.files[0])}
            />
          </div>

          <button
            type="submit"
            className="col-span-2 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            Create Organisation
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateOrg;