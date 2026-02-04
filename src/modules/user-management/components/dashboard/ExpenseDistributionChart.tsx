import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

export interface ExpenseDistributionSlice {
  name: string;
  value: number;
  color: string;
}

const CustomTooltip = ({ active, payload, formatRupiah }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-sm mb-2">{payload[0].name}</p>
        <p className="text-xs" style={{ color: payload[0].color }}>
          {formatRupiah(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export default function ExpenseDistributionChart({
  data,
  formatRupiah,
}: {
  data: ExpenseDistributionSlice[];
  formatRupiah: (value: number) => string;
}) {
  return (
    <div className="flex items-center justify-center mb-4">
      <div className="relative w-32 h-32">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={35}
              outerRadius={55}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip formatRupiah={formatRupiah} />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

