import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Line, Legend } from "recharts";

export interface CashFlowChartPoint {
  month: string;
  income: number;
  expenses: number;
}

export default function CashFlowChart({
  data,
  formatRupiah,
}: {
  data: CashFlowChartPoint[];
  formatRupiah: (value: number) => string;
}) {
  return (
    <ResponsiveContainer width="100%" height={280} minHeight={200}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
        <YAxis stroke="#6B7280" fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #E5E7EB",
            borderRadius: "8px",
            padding: "12px",
          }}
          formatter={(value: number) => formatRupiah(value)}
        />
        <Legend />
        <Area
          type="monotone"
          dataKey="income"
          stroke="#3B82F6"
          fillOpacity={1}
          fill="url(#colorIncome)"
          strokeWidth={2}
          name="Income"
        />
        <Line
          type="monotone"
          dataKey="expenses"
          stroke="#F59E0B"
          strokeWidth={2}
          dot={{ fill: "#F59E0B", r: 4 }}
          name="Expenses"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

