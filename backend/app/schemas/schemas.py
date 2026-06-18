from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime
from app.models.models import OrderStatus


# ── Product Schemas ──────────────────────────────────────────────────
class ProductBase(BaseModel):
    name: str
    sku: str
    description: Optional[str] = None
    price: float
    stock_quantity: int = 0
    category: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    stock_quantity: Optional[int] = None
    category: Optional[str] = None

class ProductOut(ProductBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True


# ── Customer Schemas ─────────────────────────────────────────────────
class CustomerBase(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

class CustomerOut(CustomerBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True


# ── Order Schemas ────────────────────────────────────────────────────
class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int

    @field_validator("quantity")
    @classmethod
    def quantity_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError("Quantity must be greater than 0")
        return v

class OrderItemOut(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: float
    product: ProductOut
    class Config:
        from_attributes = True

class OrderCreate(BaseModel):
    customer_id: int
    items: List[OrderItemCreate]
    notes: Optional[str] = None

class OrderUpdate(BaseModel):
    status: Optional[OrderStatus] = None
    notes: Optional[str] = None

class OrderOut(BaseModel):
    id: int
    customer_id: int
    status: OrderStatus
    total_amount: float
    notes: Optional[str]
    created_at: datetime
    customer: CustomerOut
    items: List[OrderItemOut]
    class Config:
        from_attributes = True

class OrderSummary(BaseModel):
    id: int
    customer_id: int
    status: OrderStatus
    total_amount: float
    created_at: datetime
    customer: CustomerOut
    class Config:
        from_attributes = True

# ── Stats Schema ─────────────────────────────────────────────────────
class DashboardStats(BaseModel):
    total_products: int
    total_customers: int
    total_orders: int
    total_revenue: float
    low_stock_products: int
    pending_orders: int
