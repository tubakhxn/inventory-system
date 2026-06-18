import { useEffect, useState } from 'react'
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../api/client'
import Modal from '../components/Modal'
import toast from 'react-hot-toast'
import { Plus, Search, Pencil, Trash2, Users } from 'lucide-react'

const EMPTY = { name: '', email: '', phone: '', address: '' }

export default function Customers() {
  const [customers, setCustomers] = useState([])
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
      const res = await getCustomers({ search: s || undefined })
      setCustomers(res.data)
    } catch { toast.error('Failed to load customers') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModalOpen(true) }
  const openEdit = (c) => { setEditing(c); setForm({ name: c.name, email: c.email, phone: c.phone || '', address: c.address || '' }); setModalOpen(true) }

  const handleSave = async () => {
    if (!form.name || !form.email) return toast.error('Name and Email are required')
    setSaving(true)
    try {
      if (editing) {
        await updateCustomer(editing.id, { name: form.name, phone: form.phone, address: form.address })
        toast.success('Customer updated')
      } else {
        await createCustomer(form)
        toast.success('Customer created')
      }
      setModalOpen(false)
      load(search)
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Error saving customer')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    try {
      await deleteCustomer(id)
      toast.success('Customer deleted')
      setDeleteConfirm(null)
      load(search)
    } catch { toast.error('Cannot delete customer with existing orders') }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500">{customers.length} registered customers</p>
        </div>
        <button className="btn-primary" onClick={openCreate}><Plus size={16} /> Add Customer</button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="input-field pl-9" placeholder="Search by name or email…" value={search}
          onChange={e => { setSearch(e.target.value); load(e.target.value) }} />
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin w-6 h-6 border-4 border-indigo-500 border-t-transparent rounded-full" />
          </div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
            <Users size={36} className="opacity-30" />
            <p className="text-sm">No customers yet. Add one!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  {['Name', 'Email', 'Phone', 'Address', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                    <td className="px-4 py-3 text-gray-500">{c.email}</td>
                    <td className="px-4 py-3 text-gray-500">{c.phone || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{c.address || '—'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{new Date(c.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button className="btn-secondary !px-2 !py-1.5" onClick={() => openEdit(c)}><Pencil size={14} /></button>
                        <button className="btn-danger !px-2 !py-1.5" onClick={() => setDeleteConfirm(c)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Customer' : 'Add Customer'}>
        <div className="space-y-4">
          {[
            { label: 'Full Name *', key: 'name', placeholder: 'e.g. Priya Sharma' },
            { label: 'Email *', key: 'email', type: 'email', placeholder: 'priya@example.com', disabled: !!editing },
            { label: 'Phone', key: 'phone', placeholder: '+91 98765 43210' },
            { label: 'Address', key: 'address', placeholder: '123 MG Road, Mumbai' },
          ].map(({ label, key, type = 'text', placeholder, disabled }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input type={type} className={`input-field ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                placeholder={placeholder} value={form[key]} disabled={disabled}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
              {key === 'email' && !editing && <p className="text-xs text-gray-400 mt-1">Email must be unique.</p>}
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <button className="btn-secondary flex-1" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn-primary flex-1 justify-center" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Customer'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Customer" size="sm">
        <p className="text-sm text-gray-600 mb-4">Delete <strong>{deleteConfirm?.name}</strong>? This cannot be undone.</p>
        <div className="flex gap-3">
          <button className="btn-secondary flex-1" onClick={() => setDeleteConfirm(null)}>Cancel</button>
          <button className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium" onClick={() => handleDelete(deleteConfirm.id)}>Delete</button>
        </div>
      </Modal>
    </div>
  )
}
