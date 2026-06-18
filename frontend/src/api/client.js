import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// ── Products ─────────────────────────────────────────────────────────
export const getProducts = (params) => api.get('/api/products/', { params })
export const getProduct = (id) => api.get(`/api/products/${id}`)
export const createProduct = (data) => api.post('/api/products/', data)
export const updateProduct = (id, data) => api.put(`/api/products/${id}`, data)
export const deleteProduct = (id) => api.delete(`/api/products/${id}`)
export const getLowStock = (threshold = 10) => api.get('/api/products/low-stock', { params: { threshold } })

// ── Customers ─────────────────────────────────────────────────────────
export const getCustomers = (params) => api.get('/api/customers/', { params })
export const getCustomer = (id) => api.get(`/api/customers/${id}`)
export const createCustomer = (data) => api.post('/api/customers/', data)
export const updateCustomer = (id, data) => api.put(`/api/customers/${id}`, data)
export const deleteCustomer = (id) => api.delete(`/api/customers/${id}`)

// ── Orders ────────────────────────────────────────────────────────────
export const getOrders = (params) => api.get('/api/orders/', { params })
export const getOrder = (id) => api.get(`/api/orders/${id}`)
export const createOrder = (data) => api.post('/api/orders/', data)
export const updateOrder = (id, data) => api.put(`/api/orders/${id}`, data)
export const deleteOrder = (id) => api.delete(`/api/orders/${id}`)

// ── Dashboard ─────────────────────────────────────────────────────────
export const getDashboardStats = () => api.get('/api/products/stats/dashboard')
