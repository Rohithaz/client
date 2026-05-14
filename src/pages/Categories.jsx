import { useState, useEffect } from "react";
import { API_BASE } from "../lib/ui";
import "./categories.css"; // optional (for styling)

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");

  // ✅ Load categories on page load
useEffect(() => {
  fetch(`${API_BASE}/categories`)
    .then((res) => res.json())
    .then((data) => setCategories(data))
    .catch(console.error);
}, []);

  // ✅ Add category
 const addCategory = async () => {
  if (!name.trim()) return;

  try {
    const res = await fetch(`${API_BASE}/categories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    });

    const data = await res.json();

    setCategories((prev) => [...prev, data]);
    setName("");
  } catch (err) {
    console.error(err);
  }
};

  return (
    <div className="category-container">
      <div className="category-card">
        <h2>Category Management</h2>

        <div className="category-form">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter category name"
          />

          <button onClick={addCategory}>Add</button>
        </div>

     <div className="category-list">
  {categories.length === 0 ? (
    <p>No categories yet</p>
  ) : (
    categories.map((cat) => (
      <div key={cat._id} className="category-item">
        {cat.name}
      </div>
    ))
  )}
</div>

      </div>
    </div>
  );
}
