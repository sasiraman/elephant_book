# Elephant Book - Personal Finance Application

A full-stack personal finance web application built with FastAPI (Python) backend and React frontend.

## Project Structure

```
elephant_book/
├── backend/          # FastAPI backend
│   ├── main.py      # Main application file
│   ├── models.py    # SQLAlchemy ORM models
│   ├── schemas.py   # Pydantic schemas
│   ├── auth.py      # Authentication utilities
│   ├── database.py  # Database connection
│   └── requirements.txt
└── frontend/        # React frontend
    ├── src/
    │   ├── pages/   # Page components
    │   ├── components/ # Reusable components
    │   ├── api.js   # API client
    │   └── App.jsx  # Main app component
    └── package.json
```

## Database Setup

The application uses PostgreSQL with the following connection settings:
- Host: localhost
- Port: 5432
- Database: elephant_book
- User: admin
- Password: @#######@***

Make sure the database and tables are already created as specified in the requirements.

## Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the server:
```bash
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`
API documentation available at `http://localhost:8000/docs`

## Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Features

### Backend
- JWT authentication with bcrypt password hashing
- CRUD operations for accounts, categories, and ledger entries
- Transfer functionality (creates 2 ledger entries automatically)
- Input validation using Pydantic
- CORS enabled for frontend communication

### Frontend
- User authentication (Login/Signup)
- Dashboard showing account balances
- Account management (Create, Read, Update, Delete)
- Category management (Create, Read, Update, Delete)
- Transaction management (Create, Read, Update, Delete)
- Transfer money between accounts
- Filter transactions by date, account, and category
- Responsive design for mobile and desktop using Tailwind CSS

## Usage

1. Start the backend server first
2. Start the frontend development server
3. Open `http://localhost:3000` in your browser
4. Sign up for a new account or login
5. Start managing your finances!

## Notes

- Ledger entries use negative amounts for debits (expenses) and positive amounts for credits (income)
- Transfers automatically create two ledger entries (negative for source account, positive for destination account)
- All transactions are filtered by the logged-in user
- JWT tokens are stored in localStorage and automatically included in API requests



New branch create
