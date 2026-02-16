import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function SearchOrg() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    const delayDebounce = setTimeout(() => {
      axios
        .get(`http://127.0.0.1:8000/org/search-organisations/?q=${query}`)
        .then((res) => {
          setResults(res.data);
        })
        .catch((err) => {
          console.error(err);
        });
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const handleClick = (slug) => {
    navigate(`/org/${slug}`);
    setQuery("");
    setResults([]);
  };

  return (
    <div className="relative w-full max-w-md">

      <input
        type="text"
        placeholder="Search Organisation..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full border p-2 rounded"
      />

      {results.length > 0 && (
        <div className="absolute bg-white shadow-lg w-full mt-1 rounded max-h-60 overflow-y-auto z-50">
          {results.map((org) => (
            <div
              key={org.id}
              onClick={() => handleClick(org.slug)}
              className="flex items-center gap-3 p-2 hover:bg-gray-100 cursor-pointer"
            >
              {org.logo && (
                <img
                  src={`http://127.0.0.1:8000${org.logo}`}
                  width="30"
                  alt="logo"
                />
              )}

              <div>
                <div className="font-medium">{org.name}</div>
                <div className="text-xs text-gray-500">
                  {org.city}, {org.state}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchOrg;