import { useEffect, useState } from 'react'
import { getLowStock, updateProduct } from '../api/client'
import toast from 'react-hot-toast'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function LowStock() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [threshold, setThreshold] = useState(10)
  const [restockValues, setRestockValues] = useState({})
  const [restocking, setRestocking] = useState({})

  const load = async () => {
    setLoading(true)
    try {
      const res = await getLowStock(threshold)
      setProducts(res.data)
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [threshold])

  const handleRestock = async (product) => {
    const qty = parseInt(restockValues[product.id] || 0)
    if (!qty || qty <= 0) return toast.error('Enter a valid quantity')
    setRestocking(r => ({ ...r, [product.id]: true }))
    try {
      await updateProduct(product.id, { stock_quantity: product.stock_quantity + qty })
      toast.success(`Restocked ${product.name} by ${qty} units`)
      setRestockValues(v => ({ ...v, [product.id]: '' }))
      load()
    } catch { toast.error('Failed to restock') }
    finally { setRestocking(r => ({ ...r, [product.id]: false })) }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Low Stock</h1>
          <p className="text-sm text-gray-500">{products.length} products need restocking</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Threshold:</span>
          <select value={threshold} onChange={e => setThreshold(parseInt(e.target.value))}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {[5, 10, 20, 50].map(t => <option key={t} value={t}>{t} units</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin w-6 h-6 border-4 border-indigo-500 border-t-transparent rounded-full" />
        </div>
      ) : products.length === 0 ? (
        <div className="card flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
          <AlertTriangle size={36} className="opacity-30" />
          <p className="text-sm">All products are well-stocked above {threshold} units ✓</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map(p => (
            <div key={p.id} className={`card p-4 border-l-4 ${p.stock_quantity === 0 ? 'border-red-500' : 'border-amber-400'}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-900">{p.name}</p>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{p.sku}</p>
                  {p.category && <p className="text-xs text-gray-400">{p.category}</p>}
                </div>
                <span className={`text-sm font-bold px-2 py-1 rounded-lg ${p.stock_quantity === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                  {p.stock_quantity === 0 ? 'OUT' : `${p.stock_quantity}`}
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-3">₹{p.price.toLocaleString()} per unit</p>
              <div className="flex gap-2">
                <input type="number" min="1" placeholder="Add units"
                  className="input-field flex-1 !py-1.5"
                  value={restockValues[p.id] || ''}
                  onChange={e => setRestockValues(v => ({ ...v, [p.id]: e.target.value }))} />
                <button className="btn-primary !py-1.5 whitespace-nowrap"
                  onClick={() => handleRestock(p)}
                  disabled={restocking[p.id]}>
                  <RefreshCw size={14} className={restocking[p.id] ? 'animate-spin' : ''} />
                  Restock
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
