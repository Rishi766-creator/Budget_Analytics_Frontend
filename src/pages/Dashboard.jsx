import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/axios";
import AnalyticsCharts from "../components/AnalyticsCharts";
import SixMonthTrendModal from "../components/SixMonthTrendModal";
import useDarkMode from "../hooks/useDarkMode";
import Skeleton from "../components/Skeleton";

export default function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const { dark, setDark } = useDarkMode();

  const [loading, setLoading] = useState(true);

  // budget
  const [budget, setBudget] = useState(null);
  const [showBudget, setShowBudget] = useState(false);
  const [budgetForm, setBudgetForm] = useState({ limitAmount: "" });

  // modals
  const [showTrend, setShowTrend] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  // data
  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);
  const [recent, setRecent] = useState([]);
  const [breakdown, setBreakdown] = useState([]);
  const [categoryMap, setCategoryMap] = useState({});
  const [cats, setCats] = useState([]);

  const [error, setError] = useState("");

  const [addForm, setAddForm] = useState({
    type: "expense",
    amount: "",
    category: "",
    date: new Date().toISOString().slice(0, 10),
    note: "",
    paymentMethod: "upi",
  });

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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  const handleAddChange = (e) => {
    setAddForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const closeAddModal = () => {
    setShowAdd(false);
    setError("");
  };

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      // 1) Categories
      const catRes = await API.get("/categories");
      const catList = catRes.data || [];
      setCats(catList);

      const map = {};
      catList.forEach((c) => (map[String(c._id)] = c.name));
      setCategoryMap(map);

      // 2) Budget
      const budgetRes = await API.get(
        `/budget?year=${selected.year}&month=${selected.month}`
      );
      setBudget(budgetRes.data?.budget || null);
      setBudgetForm({
        limitAmount: String(budgetRes.data?.budget?.limitAmount ?? ""),
      });

      // 3) Monthly summary
      const summaryRes = await API.get(
        `/analytics/monthly?year=${selected.year}&month=${selected.month}`
      );

      let inc = 0;
      let exp = 0;
      (summaryRes.data || []).forEach((row) => {
        if (row._id === "income") inc = row.total || 0;
        if (row._id === "expense") exp = row.total || 0;
      });
      setIncome(inc);
      setExpense(exp);

      // 4) Recent transactions
      const start = new Date(selected.year, selected.month - 1, 1);
      const end = new Date(selected.year, selected.month, 1);
      const from = start.toISOString().slice(0, 10);
      const to = end.toISOString().slice(0, 10);

      const expenseRes = await API.get(`/expenses?from=${from}&to=${to}`);
      const list = expenseRes.data?.expenses || [];
      setRecent(list.slice(0, 5));

      // 5) Category breakdown
      const bdRes = await API.get(
        `/analytics/category?year=${selected.year}&month=${selected.month}`
      );
      setBreakdown(bdRes.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected.year, selected.month]);

  const savings = income - expense;

  const savingsRate = useMemo(() => {
    if (!income || income <= 0) return 0;
    return ((income - expense) / income) * 100;
  }, [income, expense]);

  const topCat = useMemo(() => {
    if (!breakdown?.length) return null;
    const sorted = [...breakdown].sort((a, b) => (b.total || 0) - (a.total || 0));
    const top = sorted[0];
    return {
      id: String(top._id),
      name: categoryMap[String(top._id)] || "Unknown",
      total: top.total || 0,
    };
  }, [breakdown, categoryMap]);

  const limitAmount = Number(budget?.limitAmount || 0);

  const budgetPct = useMemo(() => {
    if (!limitAmount) return 0;
    return (expense / limitAmount) * 100;
  }, [expense, limitAmount]);

  const budgetStatus = useMemo(() => {
    if (!limitAmount) return "not_set";
    if (budgetPct >= 100) return "over";
    if (budgetPct >= 80) return "warning";
    return "ok";
  }, [limitAmount, budgetPct]);

  const saveBudget = async (e) => {
    e.preventDefault();
    setError("");

    const limit = Number(budgetForm.limitAmount);
    if (!budgetForm.limitAmount || Number.isNaN(limit) || limit <= 0) {
      setError("Budget limit must be a number > 0");
      return;
    }

    try {
      const res = await API.put("/budget", {
        year: selected.year,
        month: selected.month,
        limitAmount: limit,
      });
      setBudget(res.data?.budget || null);
      setShowBudget(false);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save budget.");
    }
  };

  const submitTransaction = async (e) => {
    e.preventDefault();
    setError("");

    if (!addForm.amount || Number(addForm.amount) <= 0) {
      setError("Amount must be greater than 0");
      return;
    }
    if (!addForm.category) {
      setError("Please select a category");
      return;
    }
    if (!addForm.date) {
      setError("Please select a date");
      return;
    }

    try {
      await API.post("/expenses", {
        type: addForm.type,
        amount: Number(addForm.amount),
        category: addForm.category,
        date: addForm.date,
        note: addForm.note,
        paymentMethod: addForm.paymentMethod,
      });

      setShowAdd(false);

      setAddForm((prev) => ({
        ...prev,
        amount: "",
        note: "",
        date: new Date().toISOString().slice(0, 10),
        paymentMethod: "upi",
        type: "expense",
        category: "",
      }));

      await fetchDashboard();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to add transaction.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Top bar */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Budget Analytics
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Welcome{user?.name ? `, ${user.name}` : ""}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setDark((p) => !p)}
              className="border border-gray-300 dark:border-gray-700 px-3 py-2 rounded-lg text-sm font-semibold
                         bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100
                         hover:bg-gray-50 dark:hover:bg-gray-800/60 transition"
              title="Toggle theme"
            >
              {dark ? "☀️ Light" : "🌙 Dark"}
            </button>

            <button
              onClick={handleLogout}
              className="bg-red-500 text-white hover:bg-red-700 px-4 py-2 rounded-lg font-semibold transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Month/Year selectors */}
      <div className="max-w-6xl mx-auto px-4 pt-4">
        <div className="flex flex-wrap items-end gap-3 justify-center sm:justify-start">
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
        </div>
      </div>

      {/* Body */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {error && (
          <div
            className="mb-4 rounded-xl p-3 border
                       bg-white dark:bg-gray-900
                       border-red-200 dark:border-red-900/60
                       text-red-700 dark:text-red-300"
          >
            {error}
          </div>
        )}

        {/* Stats Cards (responsive) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Income */}
          <div className="rounded-2xl border shadow-sm p-5 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-3 w-28" />
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Income</p>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                  {formatMoney(income)}
                </h2>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {months[selected.month - 1]} {selected.year}
                </p>
              </>
            )}
          </div>

          {/* Expense */}
          <div className="rounded-2xl border shadow-sm p-5 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-3 w-28" />
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Expenses</p>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                  {formatMoney(expense)}
                </h2>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {months[selected.month - 1]} {selected.year}
                </p>
              </>
            )}
          </div>

          {/* Savings */}
          <div className="rounded-2xl border shadow-sm p-5 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-3 w-44" />
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500 dark:text-gray-400">Savings</p>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                  {formatMoney(savings)}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Savings Rate: {savingsRate.toFixed(1)}%
                </p>
              </>
            )}
          </div>

          {/* Top Category */}
          <div className="rounded-2xl border shadow-sm p-5 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-7 w-44" />
                <Skeleton className="h-3 w-32" />
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500 dark:text-gray-400">Top Category</p>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                  {topCat ? topCat.name : "-"}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {topCat ? `${formatMoney(topCat.total)} spent` : "No expenses"}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Budget Card */}
        <div className="rounded-2xl border shadow-sm p-5 mt-5 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Monthly Expense Budget
              </p>

              <div className="mt-1">
                {loading ? (
                  <Skeleton className="h-6 w-40" />
                ) : (
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {limitAmount ? formatMoney(limitAmount) : "Not set"}
                  </h2>
                )}
              </div>

              {loading ? (
                <div className="mt-3 space-y-2">
                  <Skeleton className="h-4 w-72" />
                  <Skeleton className="h-4 w-56" />
                </div>
              ) : limitAmount ? (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Spent {formatMoney(expense)} • {budgetPct.toFixed(0)}%
                  {budgetStatus === "warning" ? " • Near limit" : ""}
                  {budgetStatus === "over" ? " • Over budget" : ""}
                </p>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Set a monthly expense limit to track overspending.
                </p>
              )}
            </div>

            <button
              onClick={() => setShowBudget(true)}
              className="w-full sm:w-auto px-4 py-2 rounded-lg font-semibold transition
                         bg-black text-white hover:bg-gray-800
                         dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              {limitAmount ? "Update" : "Set Budget"}
            </button>
          </div>

          {loading ? (
            <div className="mt-4">
              <Skeleton className="h-3 w-full rounded-full" />
              <Skeleton className="h-3 w-40 mt-3" />
            </div>
          ) : limitAmount ? (
            <div className="mt-4">
              <div className="h-3 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-3 bg-black dark:bg-white rounded-full"
                  style={{ width: `${Math.min(100, budgetPct)}%` }}
                />
              </div>
              {budgetPct > 100 ? (
                <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                  Over by {formatMoney(expense - limitAmount)}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Action Buttons (responsive) */}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={() => setShowTrend(true)}
            className="w-full sm:w-auto px-4 py-2 rounded-lg font-semibold transition
                       bg-black text-white hover:bg-gray-800
                       dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            View 6-Month Trend
          </button>

          <button
            onClick={() => setShowAnalytics(true)}
            className="w-full sm:w-auto px-4 py-2 rounded-lg font-semibold transition
                       bg-black text-white hover:bg-gray-800
                       dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            Analytics
          </button>
        </div>

        <SixMonthTrendModal
          open={showTrend}
          onClose={() => setShowTrend(false)}
          year={selected.year}
          month={selected.month}
        />

        <AnalyticsCharts
          open={showAnalytics}
          onClose={() => setShowAnalytics(false)}
          income={income}
          expense={expense}
          breakdown={breakdown}
          categoryMap={categoryMap}
        />

        {/* Main Grid (responsive) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
          {/* Recent Transactions */}
          <div className="lg:col-span-2 rounded-2xl border shadow-sm p-5 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Recent Transactions
              </h3>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowAdd(true)}
                  className="text-sm font-semibold text-black dark:text-gray-100 hover:underline"
                >
                  + Add
                </button>

                <button
                  onClick={() => navigate("/transactions")}
                  className="text-sm font-semibold text-black dark:text-gray-100 hover:underline"
                >
                  View All
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-xl border
                                 bg-gray-50 dark:bg-gray-950
                                 border-gray-200 dark:border-gray-800"
                    >
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-44" />
                        <Skeleton className="h-3 w-60" />
                      </div>
                      <Skeleton className="h-5 w-20" />
                    </div>
                  ))}
                </div>
              ) : recent.length === 0 ? (
                <div className="flex items-center justify-between p-3 rounded-xl border
                                bg-gray-50 dark:bg-gray-950
                                border-gray-200 dark:border-gray-800">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      No transactions
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Add your first expense/income
                    </p>
                  </div>
                  <p className="font-bold text-gray-900 dark:text-gray-100">₹0</p>
                </div>
              ) : (
                recent.map((t) => (
                  <div
                    key={t._id}
                    className="flex items-center justify-between p-3 rounded-xl border
                               bg-gray-50 dark:bg-gray-950
                               border-gray-200 dark:border-gray-800"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {t.note ? t.note : t.type === "income" ? "Income" : "Expense"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(t.date)} • {t.paymentMethod || "upi"}
                      </p>
                    </div>
                    <p className="font-bold text-gray-900 dark:text-gray-100">
                      {formatMoney(t.amount)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column Stack */}
          <div className="space-y-4">
            {/* Category Breakdown */}
            <div className="rounded-2xl border shadow-sm p-5 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Category Breakdown
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                (Expenses only) {months[selected.month - 1]} {selected.year}
              </p>

              <div className="mt-4 space-y-2">
                {loading ? (
                  <div className="space-y-2">
                    {[...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 rounded-lg border
                                   bg-gray-50 dark:bg-gray-950
                                   border-gray-200 dark:border-gray-800"
                      >
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    ))}
                  </div>
                ) : breakdown.length === 0 ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    No category spend data for this month.
                  </div>
                ) : (
                  breakdown
                    .slice()
                    .sort((a, b) => (b.total || 0) - (a.total || 0))
                    .slice(0, 6)
                    .map((row) => (
                      <div
                        key={String(row._id)}
                        className="flex items-center justify-between p-2 rounded-lg border
                                   bg-gray-50 dark:bg-gray-950
                                   border-gray-200 dark:border-gray-800"
                      >
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                          {categoryMap[String(row._id)] || "Unknown Category"}
                        </p>
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                          {formatMoney(row.total)}
                        </p>
                      </div>
                    ))
                )}
              </div>

              <Link
                to="/categories"
                className="mt-4 block text-center w-full py-2 rounded-lg font-semibold transition
                           bg-black text-white hover:bg-gray-800
                           dark:bg-white dark:text-black dark:hover:bg-gray-200"
              >
                Manage Categories
              </Link>
            </div>

            {/* Quick Actions / Optional card */}
            <div className="rounded-2xl border shadow-sm p-5 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">Quick Actions</p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => setShowAdd(true)}
                  className="px-4 py-2 rounded-lg font-semibold transition
                             bg-black text-white hover:bg-gray-800
                             dark:bg-white dark:text-black dark:hover:bg-gray-200"
                >
                  + Add Transaction
                </button>
                <button
                  onClick={() => navigate("/transactions")}
                  className="px-4 py-2 rounded-lg font-semibold transition
                             border border-gray-300 dark:border-gray-700
                             bg-white dark:bg-gray-950
                             text-gray-900 dark:text-gray-100
                             hover:bg-gray-50 dark:hover:bg-gray-800/60"
                >
                  View All
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Add Transaction Modal */}
        {showAdd && (
          <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center px-4 z-50">
            <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  Add Transaction
                </h2>
                <button
                  onClick={closeAddModal}
                  className="text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100 text-xl leading-none"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <form onSubmit={submitTransaction} className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type
                  </label>
                  <select
                    name="type"
                    value={addForm.type}
                    onChange={handleAddChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700
                               bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100
                               focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:outline-none"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={addForm.amount}
                    onChange={handleAddChange}
                    placeholder="e.g., 200"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700
                               bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100
                               placeholder:text-gray-400 dark:placeholder:text-gray-500
                               focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    name="category"
                    value={addForm.category}
                    onChange={handleAddChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700
                               bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100
                               focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:outline-none"
                  >
                    <option value="">Select category</option>
                    {cats
                      .filter((c) => c.type === addForm.type)
                      .map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Categories shown based on selected type.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={addForm.date}
                    onChange={handleAddChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700
                               bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100
                               focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Payment Method
                  </label>
                  <select
                    name="paymentMethod"
                    value={addForm.paymentMethod}
                    onChange={handleAddChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700
                               bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100
                               focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:outline-none"
                  >
                    <option value="upi">UPI</option>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="bank">Bank Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Note (optional)
                  </label>
                  <input
                    type="text"
                    name="note"
                    value={addForm.note}
                    onChange={handleAddChange}
                    placeholder="e.g., Biryani"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700
                               bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100
                               placeholder:text-gray-400 dark:placeholder:text-gray-500
                               focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:outline-none"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeAddModal}
                    className="w-full border border-gray-300 dark:border-gray-700
                               bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                               py-2 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="w-full bg-black text-white py-2 rounded-lg font-semibold
                               hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 transition"
                  >
                    Add
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Budget Modal */}
        {showBudget && (
          <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center px-4 z-50">
            <div className="w-full max-w-lg rounded-2xl shadow-xl border p-6 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  Set Monthly Budget
                </h2>
                <button
                  onClick={() => {
                    setShowBudget(false);
                    setError("");
                  }}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-xl leading-none"
                >
                  ×
                </button>
              </div>

              <form onSubmit={saveBudget} className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Expense Limit ({months[selected.month - 1]} {selected.year})
                  </label>
                  <input
                    type="number"
                    value={budgetForm.limitAmount}
                    onChange={(e) => setBudgetForm({ limitAmount: e.target.value })}
                    placeholder="e.g., 20000"
                    className="w-full px-4 py-2 rounded-lg border
                               bg-white dark:bg-gray-950
                               border-gray-300 dark:border-gray-700
                               text-gray-900 dark:text-gray-100
                               focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:outline-none"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    This tracks total monthly expenses against your limit.
                  </p>
                </div>

                {error && (
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBudget(false);
                      setError("");
                    }}
                    className="w-full border py-2 rounded-lg font-semibold transition
                               border-gray-300 dark:border-gray-700
                               bg-white dark:bg-gray-800
                               text-gray-900 dark:text-gray-100
                               hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-full py-2 rounded-lg font-semibold transition
                               bg-black text-white hover:bg-gray-800
                               dark:bg-white dark:text-black dark:hover:bg-gray-200"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}