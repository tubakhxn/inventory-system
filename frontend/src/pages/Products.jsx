import { useEffect, useState } from 'react'
import { getProducts, createProduct, updateProduct, deleteProduct } from '../api/client'
import Modal from '../components/Modal'
import toast from 'react-hot-toast'
import { Plus, Search, Pencil, Trash2, Package } from 'lucide-react'

const EMPTY = { name: '', sku: '', description: '', price: '', stock_quantity: '', category: '' }

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const load = async (s = '') => {
    setLoading(true)
    try {
      const res = await getProducts({ search: s || undefined })
      setProducts(res.data)
    } catch { toast.error('Failed to load products') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModalOpen(true) }
  const openEdit = (p) => {
    setEditing(p)
    setForm({ name: p.name, sku: p.sku, description: p.description || '', price: p.price, stock_quantity: p.stock_quantity, category: p.category || '' })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.sku || !form.price) return toast.error('Name, SKU and Price are required')
    setSaving(true)
    try {
      const payload = { ...form, price: parseFloat(form.price), stock_quantity: parseInt(form.stock_quantity) || 0 }
      if (editing) {
        await updateProduct(editing.id, { name: payload.name, description: payload.description, price: payload.price, stock_quantity: payload.stock_quantity, category: payload.category })
        toast.success('Product updated')
      } else {
        await createProduct(payload)
        toast.success('Product created')
      }
      setModalOpen(false)
      load(search)
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Error saving product')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    try {
      await deleteProduct(id)
      toast.success('Product deleted')
      setDeleteConfirm(null)
      load(search)
    } catch { toast.error('Cannot delete product linked to orders') }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500">{products.length} products in inventory</p>
        </div>
        <button className="btn-primary" onClick={openCreate}><Plus size={16} /> Add Product</button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="input-field pl-9"
          placeholder="Search by name or SKU…"
          value={search}
          onChange={e => { setSearch(e.target.value); load(e.target.value) }}
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin w-6 h-6 border-4 border-indigo-500 border-t-transparent rounded-full" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
            <Package size={36} className="opacity-30" />
            <p className="text-sm">No products found. Add one!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  {['Name', 'SKU', 'Category', 'Price', 'Stock', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.sku}</td>
                    <td className="px-4 py-3 text-gray-500">{p.category || '—'}</td>
                    <td className="px-4 py-3 font-medium">₹{p.price.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${p.stock_quantity === 0 ? 'bg-red-100 text-red-700' : p.stock_quantity < 10 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                        {p.stock_quantity} units
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button className="btn-secondary !px-2 !py-1.5" onClick={() => openEdit(p)}><Pencil size={14} /></button>
                        <button className="btn-danger !px-2 !py-1.5" onClick={() => setDeleteConfirm(p)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Product' : 'Add New Product'}>
        <div className="space-y-4">
          {[
            { label: 'Product Name *', key: 'name', placeholder: 'e.g. Wireless Mouse' },
            { label: 'SKU *', key: 'sku', placeholder: 'e.g. MOUSE-001', disabled: !!editing },
            { label: 'Category', key: 'category', placeholder: 'e.g. Electronics' },
            { label: 'Price (₹) *', key: 'price', type: 'number', placeholder: '0.00' },
            { label: 'Stock Quantity *', key: 'stock_quantity', type: 'number', placeholder: '0' },
          ].map(({ label, key, type = 'text', placeholder, disabled }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type={type}
                className={`input-field ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                placeholder={placeholder}
                value={form[key]}
                disabled={disabled}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              />
              {key === 'sku' && !editing && <p className="text-xs text-gray-400 mt-1">SKU must be unique and cannot be changed later.</p>}
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="input-field resize-none"
              rows={3}
              placeholder="Optional product description…"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button className="btn-secondary flex-1" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn-primary flex-1 justify-center" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Product" size="sm">
        <p className="text-sm text-gray-600 mb-4">Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>? This cannot be undone.</p>
        <div className="flex gap-3">
          <button className="btn-secondary flex-1" onClick={() => setDeleteConfirm(null)}>Cancel</button>
          <button className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all" onClick={() => handleDelete(deleteConfirm.id)}>Delete</button>
        </div>
      </Modal>
    </div>
  )
}
