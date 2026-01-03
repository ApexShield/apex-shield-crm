import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function StatsCard({ title, value, icon: Icon, color, trend }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="relative overflow-hidden bg-white border-0 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
              <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
              {trend && (
                <p className="text-xs text-emerald-600 mt-2 font-medium">
                  {trend}
                </p>
              )}
            </div>
            <div className={`p-3 rounded-xl ${color}`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <div className={`absolute bottom-0 left-0 right-0 h-1 ${color}`} />
      </Card>
    </motion.div>
  );
}