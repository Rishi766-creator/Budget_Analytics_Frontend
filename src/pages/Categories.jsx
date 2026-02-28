import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import Skeleton from "../components/Skeleton";

export default function Categories() {
  const navigate = useNavigate();

  const [type, setType] = useState("expense"); // expense | income
  const [name, setName] = useState("");
  const [items, setItems] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await API.get(`/categories?type=${type}`);
      setItems(res.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Category name is required");
      return;
    }

    try {
      setSaving(true);
      await API.post("/categories", { name: name.trim(), type });
      setName("");
      fetchCategories();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to add category.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setError("");
    try {
      await API.delete(`/categories/${id}`);
      setItems((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete category.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Top bar */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Manage Categories
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Add / view your categories
            </p>
          </div>

          <button
            onClick={() => navigate("/dashboard")}
            className="self-start sm:self-auto px-4 py-2 rounded-lg font-semibold transition
                       bg-black text-white hover:bg-gray-800
                       dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            Back
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 rounded-xl p-3 border
                          bg-white dark:bg-gray-900
                          border-red-200 dark:border-red-900/60
                          text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Type switch (responsive wrap) */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setType("expense")}
            className={`px-4 py-2 rounded-lg font-semibold border transition
              ${
                type === "expense"
                  ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white"
                  : "bg-white text-gray-800 border-gray-200 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-800 dark:hover:bg-gray-800/60"
              }`}
          >
            Expense
          </button>

          <button
            onClick={() => setType("income")}
            className={`px-4 py-2 rounded-lg font-semibold border transition
              ${
                type === "income"
                  ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white"
                  : "bg-white text-gray-800 border-gray-200 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-800 dark:hover:bg-gray-800/60"
              }`}
          >
            Income
          </button>
        </div>

        {/* Add form */}
        <div className="rounded-2xl border shadow-sm p-5
                        bg-white dark:bg-gray-900
                        border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Add Category
          </h2>

          <form
            onSubmit={handleAdd}
            className="mt-4 flex flex-col sm:flex-row gap-3"
          >
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Food, Travel, Salary..."
              className="flex-1 px-4 py-2 rounded-lg border
                         bg-white dark:bg-gray-950
                         border-gray-300 dark:border-gray-700
                         text-gray-900 dark:text-gray-100
                         placeholder:text-gray-400 dark:placeholder:text-gray-500
                         focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20"
            />

            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto px-6 py-2 rounded-lg font-semibold transition
                         bg-black text-white hover:bg-gray-800
                         disabled:opacity-60 disabled:cursor-not-allowed
                         dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              {saving ? "Adding..." : "Add"}
            </button>
          </form>
        </div>

        {/* List */}
        <div className="mt-6 rounded-2xl border shadow-sm p-5
                        bg-white dark:bg-gray-900
                        border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Your Categories
          </h2>

          {loading ? (
            <div className="mt-4 space-y-2">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl border
                             bg-gray-50 dark:bg-gray-950
                             border-gray-200 dark:border-gray-800"
                >
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-14" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
              No categories yet.
            </p>
          ) : (
            <div className="mt-4 space-y-2">
              {items.map((c) => (
                <div
                  key={c._id}
                  className="flex items-center justify-between p-3 rounded-xl border
                             bg-gray-50 dark:bg-gray-950
                             border-gray-200 dark:border-gray-800"
                >
                  <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {c.name}
                  </p>

                  <button
                    onClick={() => handleDelete(c._id)}
                    className="text-sm font-semibold text-red-600 dark:text-red-400 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}