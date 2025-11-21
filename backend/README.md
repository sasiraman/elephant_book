# Elephant Book Backend

FastAPI backend for the Elephant Book personal finance application.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Make sure PostgreSQL is running and the database `elephant_book` exists with the tables already created.

3. Run the server:
```bash
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

API documentation available at `http://localhost:8000/docs`



