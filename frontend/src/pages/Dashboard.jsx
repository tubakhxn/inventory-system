import { useEffect, useState } from 'react'
import { getDashboardStats, getLowStock, getOrders } from '../api/client'
import { Package, Users, ShoppingCart, DollarSign, AlertTriangle, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'

const StatCard = ({ label, value, icon: Icon, color, sub }) => (
  <div className="card p-5 flex items-start gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
)

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [lowStock, setLowStock] = useState([])
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getDashboardStats(),
      getLowStock(10),
      getOrders({ limit: 5 }),
    ]).then(([s, ls, o]) => {
      setStats(s.data)
      setLowStock(ls.data)
      setRecentOrders(o.data)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
    </div>
  )

  const statusBadge = (s) => <span className={`badge-${s}`}>{s}</span>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of your inventory and orders</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total Products" value={stats?.total_products ?? 0} icon={Package} color="bg-indigo-500" />
        <StatCard label="Customers" value={stats?.total_customers ?? 0} icon={Users} color="bg-blue-500" />
        <StatCard label="Total Orders" value={stats?.total_orders ?? 0} icon={ShoppingCart} color="bg-violet-500" />
        <StatCard label="Revenue" value={`₹${(stats?.total_revenue ?? 0).toLocaleString()}`} icon={DollarSign} color="bg-emerald-500" />
        <StatCard label="Low Stock Items" value={stats?.low_stock_products ?? 0} icon={AlertTriangle} color="bg-amber-500" sub="< 10 units" />
        <StatCard label="Pending Orders" value={stats?.pending_orders ?? 0} icon={Clock} color="bg-rose-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low stock */}
        <div className="card">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Low Stock Alerts</h2>
            <Link to="/low-stock" className="text-xs text-indigo-600 hover:underline">View all</Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="p-4 text-sm text-gray-500 text-center">All products are well-stocked ✓</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {lowStock.slice(0, 5).map(p => (
                <div key={p.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{p.name}</p>
                    <p className="text-xs text-gray-400">SKU: {p.sku}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${p.stock_quantity === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                    {p.stock_quantity} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent orders */}
        <div className="card">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Recent Orders</h2>
            <Link to="/orders" className="text-xs text-indigo-600 hover:underline">View all</Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="p-4 text-sm text-gray-500 text-center">No orders yet</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentOrders.map(o => (
                <div key={o.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">#{o.id} — {o.customer?.name}</p>
                    <p className="text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    {statusBadge(o.status)}
                    <p className="text-xs text-gray-500 mt-1">₹{o.total_amount.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
