import { useEffect, useState } from "react";
import API from "../api/axios";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

export default function SixMonthTrendModal({ open, onClose, year, month }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    const fetchTrend = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await API.get(`/analytics/trend6?year=${year}&month=${month}`);
        setData(res.data || []);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load trend");
      } finally {
        setLoading(false);
      }
    };

    fetchTrend();
  }, [open, year, month]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
      <div className="w-full max-w-4xl rounded-2xl border shadow-xl p-6 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            6-Month Trend
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-xl"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-3 rounded-xl p-3 border
                          bg-white dark:bg-gray-900
                          border-red-200 dark:border-red-900/60
                          text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Chart */}
        <div className="mt-4 h-[360px]">
          {loading ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
          ) : data.length === 0 ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              No data for this range.
            </div>
          ) : (
            <div className="h-full w-full rounded-xl border bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800 p-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.25} />
                  <XAxis dataKey="label" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />

                  <Tooltip
                    contentStyle={{
                      background: "rgba(17,24,39,0.95)", // gray-900
                      border: "1px solid rgba(75,85,99,0.6)", // gray-600
                      borderRadius: 12,
                      color: "#f9fafb", // gray-50
                    }}
                    itemStyle={{ color: "#f9fafb" }}
                    labelStyle={{ color: "#e5e7eb" }} // gray-200
                  />

                  <Legend wrapperStyle={{ color: "#e5e7eb" }} />

                  <Line
                    type="monotone"
                    dataKey="income"
                    stroke="#16a34a"
                    strokeWidth={3}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="expense"
                    stroke="#dc2626"
                    strokeWidth={3}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-5 flex justify-center">
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