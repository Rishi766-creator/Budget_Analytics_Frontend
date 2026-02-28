import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Legend,
  Cell,
} from "recharts";

export default function AnalyticsChart({
  open,
  onClose,
  income = 0,
  expense = 0,
  breakdown = [],
  categoryMap = {},
}) {
  const COLORS = ["#0ea5e9", "#0284c7", "#06b6d4", "#22d3ee", "#38bdf8"];

  const toNum = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const money = (n) => `₹${toNum(n || 0).toLocaleString("en-IN")}`;

  const pieData = (breakdown || [])
    .filter((x) => (x?.total || 0) > 0)
    .map((x) => ({
      name: categoryMap[String(x._id)] || "Unknown",
      value: Number(x.total || 0),
    }));

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
      <div className="w-full max-w-4xl rounded-2xl border shadow-xl p-6 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Analytics
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-xl"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
          {/* Bar chart card */}
          <div className="rounded-2xl border shadow-sm p-5 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Income vs Expense
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              This month comparison
            </p>

            {/* chart panel */}
            <div className="mt-4 h-64 w-full min-w-0 rounded-xl border bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800 p-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: "This Month", Income: toNum(income), Expense: toNum(expense) },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.25} />
                  <XAxis dataKey="name" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    formatter={(v) => money(v)}
                    contentStyle={{
                      background: "rgba(17,24,39,0.95)", // gray-900
                      border: "1px solid rgba(75,85,99,0.6)", // gray-600
                      borderRadius: 12,
                      color: "#f9fafb", // gray-50
                    }}
                    itemStyle={{ color: "#f9fafb" }}
                    labelStyle={{ color: "#e5e7eb" }} // gray-200
                  />
                  <Legend
                    wrapperStyle={{ color: "#e5e7eb" }}
                  />
                  <Bar dataKey="Income" fill="#16a34a" barSize={30} radius={[8, 8, 0, 0]} />
                  <Bar dataKey="Expense" fill="#dc2626" barSize={30} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie chart card */}
          <div className="rounded-2xl border shadow-sm p-5 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Spending by category
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Expenses only
            </p>

            {pieData.length === 0 ? (
              <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
                No Category spend data to display
              </div>
            ) : (
              <div className="mt-4 h-64 w-full min-w-0 rounded-xl border bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800 p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      formatter={(v) => money(v)}
                      contentStyle={{
                        background: "rgba(17,24,39,0.95)",
                        border: "1px solid rgba(75,85,99,0.6)",
                        borderRadius: 12,
                        color: "#f9fafb",
                      }}
                      itemStyle={{ color: "#f9fafb" }}
                      labelStyle={{ color: "#e5e7eb" }}
                    />
                    <Legend wrapperStyle={{ color: "#e5e7eb" }} />
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={90}
                      label
                    >
                      {pieData.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-semibold transition
                       bg-black text-white hover:bg-gray-800
                       dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}