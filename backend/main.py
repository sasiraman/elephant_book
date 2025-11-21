from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime
from typing import List, Optional
from decimal import Decimal

from database import get_db
from models import User, Account, Category, AccountLedger
from schemas import (
    UserCreate, UserResponse, LoginRequest, Token,
    AccountCreate, AccountUpdate, AccountResponse, AccountWithBalance,
    CategoryCreate, CategoryUpdate, CategoryResponse,
    LedgerCreate, LedgerUpdate, LedgerResponse,
    TransferCreate
)
from auth import get_password_hash, verify_password, create_access_token, get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES
from datetime import timedelta

app = FastAPI(title="Elephant Book API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authentication endpoints
@app.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        email=user_data.email,
        password_hash=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/login", response_model=Token)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# Account endpoints
@app.get("/accounts", response_model=List[AccountWithBalance])
def get_accounts(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    accounts = db.query(Account).filter(Account.user_id == current_user.id).all()
    result = []
    for account in accounts:
        balance = db.query(func.coalesce(func.sum(AccountLedger.amount), 0)).filter(
            AccountLedger.account_id == account.id
        ).scalar() or Decimal('0')
        account_dict = {
            **account.__dict__,
            "balance": balance
        }
        result.append(AccountWithBalance(**account_dict))
    return result

@app.post("/accounts", response_model=AccountResponse, status_code=status.HTTP_201_CREATED)
def create_account(account_data: AccountCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_account = Account(
        user_id=current_user.id,
        account_name=account_data.account_name,
        account_type=account_data.account_type
    )
    db.add(new_account)
    db.commit()
    db.refresh(new_account)
    return new_account

@app.get("/accounts/{account_id}", response_model=AccountWithBalance)
def get_account(account_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    account = db.query(Account).filter(
        Account.id == account_id,
        Account.user_id == current_user.id
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    balance = db.query(func.coalesce(func.sum(AccountLedger.amount), 0)).filter(
        AccountLedger.account_id == account.id
    ).scalar() or Decimal('0')
    account_dict = {
        **account.__dict__,
        "balance": balance
    }
    return AccountWithBalance(**account_dict)

@app.put("/accounts/{account_id}", response_model=AccountResponse)
def update_account(account_id: int, account_data: AccountUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    account = db.query(Account).filter(
        Account.id == account_id,
        Account.user_id == current_user.id
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    if account_data.account_name is not None:
        account.account_name = account_data.account_name
    if account_data.account_type is not None:
        account.account_type = account_data.account_type
    
    db.commit()
    db.refresh(account)
    return account

@app.delete("/accounts/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(account_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    account = db.query(Account).filter(
        Account.id == account_id,
        Account.user_id == current_user.id
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    db.delete(account)
    db.commit()
    return None

# Category endpoints
@app.get("/categories", response_model=List[CategoryResponse])
def get_categories(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    categories = db.query(Category).filter(Category.user_id == current_user.id).all()
    return categories

@app.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(category_data: CategoryCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if category_data.category_type not in ['income', 'expense']:
        raise HTTPException(status_code=400, detail="category_type must be 'income' or 'expense'")
    
    new_category = Category(
        user_id=current_user.id,
        category_type=category_data.category_type,
        name=category_data.name
    )
    db.add(new_category)
    db.commit()
    db.refresh(new_category)
    return new_category

@app.get("/categories/{category_id}", response_model=CategoryResponse)
def get_category(category_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    category = db.query(Category).filter(
        Category.id == category_id,
        Category.user_id == current_user.id
    ).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category

@app.put("/categories/{category_id}", response_model=CategoryResponse)
def update_category(category_id: int, category_data: CategoryUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    category = db.query(Category).filter(
        Category.id == category_id,
        Category.user_id == current_user.id
    ).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    if category_data.category_type is not None:
        if category_data.category_type not in ['income', 'expense']:
            raise HTTPException(status_code=400, detail="category_type must be 'income' or 'expense'")
        category.category_type = category_data.category_type
    if category_data.name is not None:
        category.name = category_data.name
    
    db.commit()
    db.refresh(category)
    return category

@app.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(category_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    category = db.query(Category).filter(
        Category.id == category_id,
        Category.user_id == current_user.id
    ).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(category)
    db.commit()
    return None

# Ledger endpoints
@app.get("/ledger", response_model=List[LedgerResponse])
def get_ledger_entries(
    account_id: Optional[int] = None,
    category_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get user's account IDs
    user_account_ids = [acc.id for acc in db.query(Account.id).filter(Account.user_id == current_user.id).all()]
    
    query = db.query(AccountLedger).filter(AccountLedger.account_id.in_(user_account_ids))
    
    if account_id:
        query = query.filter(AccountLedger.account_id == account_id)
    if category_id:
        query = query.filter(AccountLedger.category_id == category_id)
    if start_date:
        query = query.filter(AccountLedger.transaction_date >= start_date)
    if end_date:
        query = query.filter(AccountLedger.transaction_date <= end_date)
    
    entries = query.order_by(AccountLedger.transaction_date.desc()).all()
    return entries

@app.post("/ledger", response_model=LedgerResponse, status_code=status.HTTP_201_CREATED)
def create_ledger_entry(ledger_data: LedgerCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Verify account belongs to user
    account = db.query(Account).filter(
        Account.id == ledger_data.account_id,
        Account.user_id == current_user.id
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    # If category is provided, verify it belongs to user
    if ledger_data.category_id:
        category = db.query(Category).filter(
            Category.id == ledger_data.category_id,
            Category.user_id == current_user.id
        ).first()
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
        
        # Determine amount sign based on category type
        # Expense: negative (debit), Income: positive (credit)
        amount = ledger_data.amount
        if category.category_type == 'expense':
            amount = -abs(amount)  # Ensure negative
        elif category.category_type == 'income':
            amount = abs(amount)  # Ensure positive
    else:
        amount = ledger_data.amount
    
    new_entry = AccountLedger(
        account_id=ledger_data.account_id,
        created_by=current_user.id,
        amount=amount,
        category_id=ledger_data.category_id,
        narration=ledger_data.narration,
        transaction_date=ledger_data.transaction_date
    )
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    return new_entry

@app.get("/ledger/{ledger_id}", response_model=LedgerResponse)
def get_ledger_entry(ledger_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user_account_ids = [acc.id for acc in db.query(Account.id).filter(Account.user_id == current_user.id).all()]
    entry = db.query(AccountLedger).filter(
        AccountLedger.id == ledger_id,
        AccountLedger.account_id.in_(user_account_ids)
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Ledger entry not found")
    return entry

@app.put("/ledger/{ledger_id}", response_model=LedgerResponse)
def update_ledger_entry(ledger_id: int, ledger_data: LedgerUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user_account_ids = [acc.id for acc in db.query(Account.id).filter(Account.user_id == current_user.id).all()]
    entry = db.query(AccountLedger).filter(
        AccountLedger.id == ledger_id,
        AccountLedger.account_id.in_(user_account_ids)
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Ledger entry not found")
    
    if ledger_data.account_id is not None:
        account = db.query(Account).filter(
            Account.id == ledger_data.account_id,
            Account.user_id == current_user.id
        ).first()
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")
        entry.account_id = ledger_data.account_id
    
    if ledger_data.category_id is not None:
        category = db.query(Category).filter(
            Category.id == ledger_data.category_id,
            Category.user_id == current_user.id
        ).first()
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
        entry.category_id = ledger_data.category_id
        
        # Adjust amount sign based on category type
        if ledger_data.amount is not None:
            amount = ledger_data.amount
            if category.category_type == 'expense':
                amount = -abs(amount)
            elif category.category_type == 'income':
                amount = abs(amount)
            entry.amount = amount
    elif ledger_data.amount is not None:
        entry.amount = ledger_data.amount
    
    if ledger_data.narration is not None:
        entry.narration = ledger_data.narration
    if ledger_data.transaction_date is not None:
        entry.transaction_date = ledger_data.transaction_date
    
    db.commit()
    db.refresh(entry)
    return entry

@app.delete("/ledger/{ledger_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ledger_entry(ledger_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user_account_ids = [acc.id for acc in db.query(Account.id).filter(Account.user_id == current_user.id).all()]
    entry = db.query(AccountLedger).filter(
        AccountLedger.id == ledger_id,
        AccountLedger.account_id.in_(user_account_ids)
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Ledger entry not found")
    db.delete(entry)
    db.commit()
    return None

# Transfer endpoint
@app.post("/transfer", response_model=List[LedgerResponse], status_code=status.HTTP_201_CREATED)
def create_transfer(transfer_data: TransferCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if transfer_data.from_account_id == transfer_data.to_account_id:
        raise HTTPException(status_code=400, detail="From and to accounts must be different")
    
    # Verify both accounts belong to user
    from_account = db.query(Account).filter(
        Account.id == transfer_data.from_account_id,
        Account.user_id == current_user.id
    ).first()
    to_account = db.query(Account).filter(
        Account.id == transfer_data.to_account_id,
        Account.user_id == current_user.id
    ).first()
    
    if not from_account or not to_account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    # Create two ledger entries
    # From account: negative amount (debit)
    from_entry = AccountLedger(
        account_id=transfer_data.from_account_id,
        created_by=current_user.id,
        amount=-abs(transfer_data.amount),
        category_id=None,
        narration=transfer_data.narration or f"Transfer to {to_account.account_name}",
        transaction_date=transfer_data.transaction_date
    )
    
    # To account: positive amount (credit)
    to_entry = AccountLedger(
        account_id=transfer_data.to_account_id,
        created_by=current_user.id,
        amount=abs(transfer_data.amount),
        category_id=None,
        narration=transfer_data.narration or f"Transfer from {from_account.account_name}",
        transaction_date=transfer_data.transaction_date
    )
    
    db.add(from_entry)
    db.add(to_entry)
    db.commit()
    db.refresh(from_entry)
    db.refresh(to_entry)
    
    return [from_entry, to_entry]

@app.get("/")
def root():
    return {"message": "Elephant Book API"}

