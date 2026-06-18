import { useEffect, useState } from 'react'
import { getOrders, createOrder, updateOrder, deleteOrder, getCustomers, getProducts } from '../api/client'
import Modal from '../components/Modal'
import toast from 'react-hot-toast'
import { Plus, Trash2, ShoppingCart, Eye, X, PlusCircle } from 'lucide-react'

const STATUS_OPTIONS = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [createOpen, setCreateOpen] = useState(false)
  const [viewOrder, setViewOrder] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // Create form state
  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState([{ product_id: '', quantity: 1 }])

  const load = async (sf = '') => {
    setLoading(true)
    try {
      const res = await getOrders({ status_filter: sf || undefined })
      setOrders(res.data)
    } catch { toast.error('Failed to load orders') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    load()
    getCustomers().then(r => setCustomers(r.data))
    getProducts().then(r => setProducts(r.data))
  }, [])

  const openCreate = () => {
    setSelectedCustomer(''); setNotes(''); setItems([{ product_id: '', quantity: 1 }])
    setCreateOpen(true)
  }

  const addItem = () => setItems(i => [...i, { product_id: '', quantity: 1 }])
  const removeItem = (idx) => setItems(i => i.filter((_, j) => j !== idx))
  const setItem = (idx, key, val) => setItems(i => i.map((item, j) => j === idx ? { ...item, [key]: val } : item))

  const calcTotal = () => items.reduce((sum, item) => {
    const p = products.find(p => p.id === parseInt(item.product_id))
    return sum + (p ? p.price * (parseInt(item.quantity) || 0) : 0)
  }, 0)

  const handleCreate = async () => {
    if (!selectedCustomer) return toast.error('Select a customer')
    if (items.some(i => !i.product_id || !i.quantity || i.quantity < 1))
      return toast.error('Fill all item fields with valid quantities')
    setSaving(true)
    try {
      await createOrder({
        customer_id: parseInt(selectedCustomer),
        notes,
        items: items.map(i => ({ product_id: parseInt(i.product_id), quantity: parseInt(i.quantity) }))
      })
      toast.success('Order placed successfully!')
      setCreateOpen(false)
      load(statusFilter)
      getProducts().then(r => setProducts(r.data)) // refresh stock
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Error creating order')
    } finally { setSaving(false) }
  }

  const handleStatusChange = async (order, newStatus) => {
    try {
      await updateOrder(order.id, { status: newStatus })
      toast.success(`Order #${order.id} → ${newStatus}`)
      load(statusFilter)
    } catch { toast.error('Failed to update status') }
  }

  const handleDelete = async (id) => {
    try {
      await deleteOrder(id)
      toast.success('Order deleted & stock restored')
      setDeleteConfirm(null)
      load(statusFilter)
      getProducts().then(r => setProducts(r.data))
    } catch { toast.error('Failed to delete order') }
  }

  const badge = (s) => <span className={`badge-${s}`}>{s}</span>

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500">{orders.length} orders</p>
        </div>
        <button className="btn-primary" onClick={openCreate}><Plus size={16} /> New Order</button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['', ...STATUS_OPTIONS].map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); load(s) }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${statusFilter === s ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin w-6 h-6 border-4 border-indigo-500 border-t-transparent rounded-full" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
            <ShoppingCart size={36} className="opacity-30" />
            <p className="text-sm">No orders found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  {['Order #', 'Customer', 'Status', 'Total', 'Date', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map(o => (
                  <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-gray-700 font-medium">#{o.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{o.customer?.name}</td>
                    <td className="px-4 py-3">
                      <select value={o.status}
                        onChange={e => handleStatusChange(o, e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white">
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">₹{o.total_amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{new Date(o.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button className="btn-secondary !px-2 !py-1.5" onClick={() => setViewOrder(o)}><Eye size={14} /></button>
                        <button className="btn-danger !px-2 !py-1.5" onClick={() => setDeleteConfirm(o)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Order Modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create New Order" size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
            <select className="input-field" value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)}>
              <option value="">Select a customer…</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Order Items *</label>
              <button onClick={addItem} className="text-indigo-600 text-xs flex items-center gap-1 hover:underline"><PlusCircle size={14} /> Add item</button>
            </div>
            <div className="space-y-2">
              {items.map((item, idx) => {
                const prod = products.find(p => p.id === parseInt(item.product_id))
                return (
                  <div key={idx} className="flex gap-2 items-start">
                    <div className="flex-1">
                      <select className="input-field" value={item.product_id}
                        onChange={e => setItem(idx, 'product_id', e.target.value)}>
                        <option value="">Select product…</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id} disabled={p.stock_quantity === 0}>
                            {p.name} (SKU: {p.sku}) — Stock: {p.stock_quantity} — ₹{p.price}
                          </option>
                        ))}
                      </select>
                      {prod && <p className="text-xs text-gray-400 mt-0.5">Available: {prod.stock_quantity} units</p>}
                    </div>
                    <input type="number" min="1" className="input-field w-20"
                      value={item.quantity} onChange={e => setItem(idx, 'quantity', e.target.value)} />
                    {items.length > 1 && (
                      <button onClick={() => removeItem(idx)} className="text-gray-400 hover:text-red-500 mt-2"><X size={16} /></button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {calcTotal() > 0 && (
            <div className="bg-indigo-50 rounded-lg px-4 py-3 flex justify-between items-center">
              <span className="text-sm font-medium text-indigo-700">Order Total</span>
              <span className="text-lg font-bold text-indigo-900">₹{calcTotal().toLocaleString()}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <textarea className="input-field resize-none" rows={2} placeholder="Any special instructions…"
              value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          <div className="flex gap-3 pt-2">
            <button className="btn-secondary flex-1" onClick={() => setCreateOpen(false)}>Cancel</button>
            <button className="btn-primary flex-1 justify-center" onClick={handleCreate} disabled={saving}>
              {saving ? 'Placing order…' : 'Place Order'}
            </button>
          </div>
        </div>
      </Modal>

      {/* View Order Modal */}
      {viewOrder && (
        <Modal isOpen={!!viewOrder} onClose={() => setViewOrder(null)} title={`Order #${viewOrder.id} Details`} size="lg">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-gray-500">Customer</p><p className="font-medium">{viewOrder.customer?.name}</p></div>
              <div><p className="text-gray-500">Status</p><span className={`badge-${viewOrder.status}`}>{viewOrder.status}</span></div>
              <div><p className="text-gray-500">Date</p><p className="font-medium">{new Date(viewOrder.created_at).toLocaleString()}</p></div>
              <div><p className="text-gray-500">Total</p><p className="font-bold text-lg">₹{viewOrder.total_amount.toLocaleString()}</p></div>
            </div>
            {viewOrder.notes && <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">📝 {viewOrder.notes}</div>}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Items</p>
              <div className="border border-gray-200 rounded-lg divide-y">
                {viewOrder.items?.map(item => (
                  <div key={item.id} className="px-4 py-3 flex justify-between text-sm">
                    <div>
                      <p className="font-medium">{item.product?.name}</p>
                      <p className="text-xs text-gray-400">SKU: {item.product?.sku} × {item.quantity}</p>
                    </div>
                    <p className="font-semibold">₹{(item.unit_price * item.quantity).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete confirm */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Order" size="sm">
        <p className="text-sm text-gray-600 mb-4">Delete Order <strong>#{deleteConfirm?.id}</strong>? Stock will be restored.</p>
        <div className="flex gap-3">
          <button className="btn-secondary flex-1" onClick={() => setDeleteConfirm(null)}>Cancel</button>
          <button className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium" onClick={() => handleDelete(deleteConfirm.id)}>Delete</button>
        </div>
      </Modal>
    </div>
  )
}
