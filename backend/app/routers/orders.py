from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.models import Order, OrderItem, Product, Customer, OrderStatus
from app.schemas.schemas import OrderCreate, OrderOut, OrderUpdate, OrderSummary

router = APIRouter()


@router.get("/", response_model=List[OrderSummary])
def list_orders(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[str] = None,
    customer_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Order)
    if status_filter:
        query = query.filter(Order.status == status_filter)
    if customer_id:
        query = query.filter(Order.customer_id == customer_id)
    return query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()


@router.post("/", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def create_order(order_data: OrderCreate, db: Session = Depends(get_db)):
    # Validate customer exists
    customer = db.query(Customer).filter(Customer.id == order_data.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    if not order_data.items:
        raise HTTPException(status_code=400, detail="Order must have at least one item")

    total_amount = 0.0
    order_items = []

    # Validate stock for ALL items before touching inventory
    for item_data in order_data.items:
        product = db.query(Product).filter(Product.id == item_data.product_id).with_for_update().first()
        if not product:
            raise HTTPException(
                status_code=404,
                detail=f"Product with id {item_data.product_id} not found"
            )
        if product.stock_quantity < item_data.quantity:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Insufficient stock for '{product.name}' (SKU: {product.sku}). "
                       f"Requested: {item_data.quantity}, Available: {product.stock_quantity}"
            )
        order_items.append((product, item_data.quantity))
        total_amount += product.price * item_data.quantity

    # All checks passed — create order and deduct stock
    db_order = Order(
        customer_id=order_data.customer_id,
        total_amount=round(total_amount, 2),
        notes=order_data.notes,
        status=OrderStatus.pending,
    )
    db.add(db_order)
    db.flush()  # get order id

    for product, quantity in order_items:
        item = OrderItem(
            order_id=db_order.id,
            product_id=product.id,
            quantity=quantity,
            unit_price=product.price,
        )
        db.add(item)
        product.stock_quantity -= quantity  # deduct stock

    db.commit()
    db.refresh(db_order)
    return db_order


@router.get("/{order_id}", response_model=OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.put("/{order_id}", response_model=OrderOut)
def update_order(order_id: int, update: OrderUpdate, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # If cancelling, restore stock
    if update.status == OrderStatus.cancelled and order.status != OrderStatus.cancelled:
        for item in order.items:
            item.product.stock_quantity += item.quantity

    for field, value in update.model_dump(exclude_none=True).items():
        setattr(order, field, value)
    db.commit()
    db.refresh(order)
    return order


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    # Restore stock if not already cancelled
    if order.status != OrderStatus.cancelled:
        for item in order.items:
            item.product.stock_quantity += item.quantity
    db.delete(order)
    db.commit()
