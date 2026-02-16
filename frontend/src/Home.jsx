import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  const cards = [
    { title: "Submit Complaint", path: "/submit" },
    { title: "Track Complaint", path: "/track" },
    { title: "Search Organisations", path: "/search" },
    { title: "View Organisation", path: "/organisation" },
    { title: "Employee Login", path: "/employee-login" },
    { title: "Manager Login", path: "/manager-login" },
    { title: "Create Organisation", path: "/create-org" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-10">
      <div className="max-w-5xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-3">
          Complaint Management System
        </h1>
        <p className="text-gray-600 mb-10">
          Smart grievance tracking & organisation management
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {cards.map((card, index) => (
            <div
              key={index}
              onClick={() => navigate(card.path)}
              className="bg-white rounded-2xl shadow-md p-6 cursor-pointer
                         hover:shadow-xl hover:scale-105 transition duration-300"
            >
              <h2 className="text-lg font-semibold text-gray-700">
                {card.title}
              </h2>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home;