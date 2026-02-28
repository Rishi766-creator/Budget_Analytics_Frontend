import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import Skeleton from "../components/Skeleton";

export default function Transactions() {
  const navigate = useNavigate();

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];

  const now = useMemo(() => new Date(), []);
  const years = useMemo(
    () => Array.from({ length: 7 }, (_, i) => now.getFullYear() - 3 + i),
    [now]
  );

  const [selected, setSelected] = useState({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  });

  const [cats, setCats] = useState([]);
  const [categoryMap, setCategoryMap] = useState({});

  const [categoryFilter, setCategoryFilter] = useState("all");

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editTx, setEditTx] = useState(null);

  const getMonthRange = (year, month) => {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    const iso = (d) => d.toISOString().slice(0, 10);
    return { from: iso(start), to: iso(end) };
  };

  const formatMoney = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

  const formatDate = (d) => {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "";
    return dt.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const fetchCategories = async () => {
    try {
      const res = await API.get("/categories");
      const list = res.data || [];
      setCats(list);

      const map = {};
      list.forEach((c) => (map[String(c._id)] = c.name));
      setCategoryMap(map);
    } catch (e) {
      console.error("Failed to load categories", e);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError("");

      const { from, to } = getMonthRange(selected.year, selected.month);

      const params = new URLSearchParams();
      params.set("from", from);
      params.set("to", to);
      if (categoryFilter !== "all") params.set("category", categoryFilter);

      const res = await API.get(`/expenses?${params.toString()}`);
      setTransactions(res.data?.expenses || []);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load transactions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected.year, selected.month, categoryFilter]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this transaction?")) return;
    try {
      await API.delete(`/expenses/${id}`);
      await fetchTransactions();
    } catch (e) {
      alert(e?.response?.data?.message || "Delete failed");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        type: editTx.type,
        amount: Number(editTx.amount),
        category: editTx.category,
        date: editTx.date?.slice(0, 10),
        note: editTx.note || "",
        paymentMethod: editTx.paymentMethod || "upi",
      };

      await API.put(`/expenses/${editTx._id}`, payload);
      setEditTx(null);
      await fetchTransactions();
    } catch (e) {
      alert(e?.response?.data?.message || "Update failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              All Transactions
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Filter and manage your transactions
            </p>
          </div>

          <button
            onClick={() => navigate(-1)}
            className="self-start sm:self-auto text-sm font-semibold text-black dark:text-gray-100 hover:underline"
          >
            Back
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-4">
        {error && (
          <div className="mb-4 rounded-xl p-3 border bg-white dark:bg-gray-900 border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="rounded-2xl border shadow-sm p-4 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            {/* Month */}
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                Month
              </label>
              <select
                value={selected.month}
                onChange={(e) =>
                  setSelected((p) => ({ ...p, month: Number(e.target.value) }))
                }
                className="border rounded-lg px-3 py-2 text-sm
                           bg-white dark:bg-gray-950
                           border-gray-300 dark:border-gray-700
                           text-gray-900 dark:text-gray-100
                           focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20"
              >
                {months.map((m, idx) => (
                  <option key={m} value={idx + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Year */}
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                Year
              </label>
              <select
                value={selected.year}
                onChange={(e) =>
                  setSelected((p) => ({ ...p, year: Number(e.target.value) }))
                }
                className="border rounded-lg px-3 py-2 text-sm
                           bg-white dark:bg-gray-950
                           border-gray-300 dark:border-gray-700
                           text-gray-900 dark:text-gray-100
                           focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm
                           bg-white dark:bg-gray-950
                           border-gray-300 dark:border-gray-700
                           text-gray-900 dark:text-gray-100
                           focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20"
              >
                <option value="all">All categories</option>
                {cats.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Clear */}
            <button
              onClick={() => setCategoryFilter("all")}
              className="w-full lg:w-auto border px-4 py-2 rounded-lg text-sm font-semibold transition
                         border-gray-300 dark:border-gray-700
                         hover:bg-gray-50 dark:hover:bg-gray-800/60
                         text-gray-900 dark:text-gray-100"
            >
              Clear Filter
            </button>
          </div>
        </div>

        {/* List */}
        <div className="mt-4 rounded-2xl border shadow-sm p-5 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Transactions
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {loading ? "" : `${transactions.length} items`}
            </p>
          </div>

          <div className="mt-4 space-y-3">
            {loading ? (
              <div className="space-y-3">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl border
                               bg-gray-50 dark:bg-gray-950
                               border-gray-200 dark:border-gray-800"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-64" />
                      </div>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-4 w-10" />
                        <Skeleton className="h-4 w-14" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                No transactions found.
              </div>
            ) : (
              transactions.map((t) => (
                <div
                  key={t._id}
                  className="p-3 rounded-xl border
                             bg-gray-50 dark:bg-gray-950
                             border-gray-200 dark:border-gray-800"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {t.note ? t.note : t.type === "income" ? "Income" : "Expense"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(t.date)} •{" "}
                        {categoryMap[String(t.category)] || "Unknown"} •{" "}
                        {t.paymentMethod || "upi"}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                      <p className="font-bold text-gray-900 dark:text-gray-100">
                        {formatMoney(t.amount)}
                      </p>

                      <button
                        onClick={() => setEditTx(t)}
                        className="text-sm font-semibold text-black dark:text-gray-100 hover:underline"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDelete(t._id)}
                        className="text-sm font-semibold text-red-600 dark:text-red-400 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editTx && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center px-4 z-50">
          <div className="w-full max-w-lg rounded-2xl shadow-xl border p-6
                          bg-white dark:bg-gray-900
                          border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Edit Transaction
              </h2>
              <button
                onClick={() => setEditTx(null)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUpdate} className="mt-4 space-y-4">
              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  value={editTx.amount}
                  onChange={(e) =>
                    setEditTx((p) => ({ ...p, amount: e.target.value }))
                  }
                  className="w-full px-4 py-2 rounded-lg border
                             bg-white dark:bg-gray-950
                             border-gray-300 dark:border-gray-700
                             text-gray-900 dark:text-gray-100
                             focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:outline-none"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  value={editTx.category}
                  onChange={(e) =>
                    setEditTx((p) => ({ ...p, category: e.target.value }))
                  }
                  className="w-full px-4 py-2 rounded-lg border
                             bg-white dark:bg-gray-950
                             border-gray-300 dark:border-gray-700
                             text-gray-900 dark:text-gray-100
                             focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:outline-none"
                >
                  {cats
                    .filter((c) => c.type === editTx.type)
                    .map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={String(editTx.date || "").slice(0, 10)}
                  onChange={(e) =>
                    setEditTx((p) => ({ ...p, date: e.target.value }))
                  }
                  className="w-full px-4 py-2 rounded-lg border
                             bg-white dark:bg-gray-950
                             border-gray-300 dark:border-gray-700
                             text-gray-900 dark:text-gray-100
                             focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:outline-none"
                />
              </div>

              {/* Payment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Payment Method
                </label>
                <select
                  value={editTx.paymentMethod || "upi"}
                  onChange={(e) =>
                    setEditTx((p) => ({ ...p, paymentMethod: e.target.value }))
                  }
                  className="w-full px-4 py-2 rounded-lg border
                             bg-white dark:bg-gray-950
                             border-gray-300 dark:border-gray-700
                             text-gray-900 dark:text-gray-100
                             focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:outline-none"
                >
                  <option value="upi">UPI</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="bank">Bank Transfer</option>
                </select>
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Note (optional)
                </label>
                <input
                  type="text"
                  value={editTx.note || ""}
                  onChange={(e) => setEditTx((p) => ({ ...p, note: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border
                             bg-white dark:bg-gray-950
                             border-gray-300 dark:border-gray-700
                             text-gray-900 dark:text-gray-100
                             focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:outline-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditTx(null)}
                  className="w-full border py-2 rounded-lg font-semibold transition
                             border-gray-300 dark:border-gray-700
                             hover:bg-gray-50 dark:hover:bg-gray-800/60
                             text-gray-900 dark:text-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full bg-black dark:bg-white text-white dark:text-black py-2 rounded-lg font-semibold transition
                             hover:bg-gray-800 dark:hover:bg-gray-200"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}