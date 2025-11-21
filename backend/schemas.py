from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from decimal import Decimal

# User Schemas
class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Account Schemas
class AccountCreate(BaseModel):
    account_name: str
    account_type: str

class AccountUpdate(BaseModel):
    account_name: Optional[str] = None
    account_type: Optional[str] = None

class AccountResponse(BaseModel):
    id: int
    user_id: int
    account_name: str
    account_type: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class AccountWithBalance(AccountResponse):
    balance: Decimal

# Category Schemas
class CategoryCreate(BaseModel):
    category_type: str  # 'income' or 'expense'
    name: str

class CategoryUpdate(BaseModel):
    category_type: Optional[str] = None
    name: Optional[str] = None

class CategoryResponse(BaseModel):
    id: int
    user_id: int
    category_type: str
    name: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# Ledger Schemas
class LedgerCreate(BaseModel):
    account_id: int
    amount: Decimal
    category_id: Optional[int] = None
    narration: Optional[str] = None
    transaction_date: datetime

class LedgerUpdate(BaseModel):
    account_id: Optional[int] = None
    amount: Optional[Decimal] = None
    category_id: Optional[int] = None
    narration: Optional[str] = None
    transaction_date: Optional[datetime] = None

class LedgerResponse(BaseModel):
    id: int
    account_id: int
    created_by: int
    amount: Decimal
    category_id: Optional[int]
    narration: Optional[str]
    transaction_date: datetime
    created_on: datetime
    
    class Config:
        from_attributes = True

# Transfer Schema
class TransferCreate(BaseModel):
    from_account_id: int
    to_account_id: int
    amount: Decimal
    narration: Optional[str] = None
    transaction_date: datetime

