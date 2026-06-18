from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from app.core.database import get_db
from app.models.models import Product
from app.schemas.schemas import ProductCreate, ProductOut, ProductUpdate, DashboardStats
from sqlalchemy import func
from app.models.models import Order, Customer, OrderStatus

router = APIRouter()


@router.get("/", response_model=List[ProductOut])
def list_products(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Product)
    if search:
        query = query.filter(
            Product.name.ilike(f"%{search}%") | Product.sku.ilike(f"%{search}%")
        )
    if category:
        query = query.filter(Product.category == category)
    return query.offset(skip).limit(limit).all()


@router.post("/", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    db_product = Product(**product.model_dump())
    try:
        db.add(db_product)
        db.commit()
        db.refresh(db_product)
        return db_product
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Product with SKU '{product.sku}' already exists"
        )


@router.get("/stats/dashboard", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_products = db.query(func.count(Product.id)).scalar()
    total_customers = db.query(func.count(Customer.id)).scalar()
    total_orders = db.query(func.count(Order.id)).scalar()
    total_revenue = db.query(func.sum(Order.total_amount)).filter(
        Order.status != OrderStatus.cancelled
    ).scalar() or 0.0
    low_stock = db.query(func.count(Product.id)).filter(Product.stock_quantity < 10).scalar()
    pending = db.query(func.count(Order.id)).filter(Order.status == OrderStatus.pending).scalar()

    return DashboardStats(
        total_products=total_products,
        total_customers=total_customers,
        total_orders=total_orders,
        total_revenue=round(total_revenue, 2),
        low_stock_products=low_stock,
        pending_orders=pending,
    )


@router.get("/low-stock", response_model=List[ProductOut])
def get_low_stock(threshold: int = 10, db: Session = Depends(get_db)):
    return db.query(Product).filter(Product.stock_quantity <= threshold).all()


@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.put("/{product_id}", response_model=ProductOut)
def update_product(product_id: int, update: ProductUpdate, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    for field, value in update.model_dump(exclude_none=True).items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
