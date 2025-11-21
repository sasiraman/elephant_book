# Database Information

## Connection Details

The Elephant Book application uses a **PostgreSQL database running on your local computer**.

### Connection Settings:
- **Host**: localhost (127.0.0.1)
- **Port**: 5432
- **Database Name**: elephant_book
- **Username**: admin
- **Password**: Meera@2005

### Connection String:
```
postgresql+psycopg://admin:Meera%402005@localhost:5432/elephant_book
```

## Database Location

The database is stored on your local machine. The exact location depends on your PostgreSQL installation:

- **macOS (Homebrew)**: Usually at `/opt/homebrew/var/postgresql@14/` or `/usr/local/var/postgresql@14/`
- **Linux**: Usually at `/var/lib/postgresql/[version]/data/`
- **Windows**: Usually at `C:\Program Files\PostgreSQL\[version]\data\`

## Accessing the Database

### Using psql Command Line:
```bash
psql -h localhost -p 5432 -U admin -d elephant_book
```

When prompted, enter password: `Meera@2005`

### Using pgAdmin (GUI):
1. Open pgAdmin
2. Add new server:
   - Host: localhost
   - Port: 5432
   - Database: elephant_book
   - Username: admin
   - Password: Meera@2005

### Using DBeaver or other GUI tools:
Use the same connection details above.

## Database Tables

The database contains the following tables:

1. **users** - User accounts
   - id, first_name, last_name, email, password_hash, created_at

2. **accounts** - Financial accounts
   - id, user_id, account_name, account_type, created_at

3. **categories** - Income and expense categories
   - id, user_id, category_type, name, created_at

4. **account_ledger** - Transaction records
   - id, account_id, created_by, amount, category_id, narration, transaction_date, created_on

## Useful SQL Commands

### View all users:
```sql
SELECT id, first_name, last_name, email, created_at FROM users;
```

### View all accounts:
```sql
SELECT a.id, a.account_name, a.account_type, u.email as user_email 
FROM accounts a 
JOIN users u ON a.user_id = u.id;
```

### View account balances:
```sql
SELECT 
    a.id,
    a.account_name,
    COALESCE(SUM(al.amount), 0) as balance
FROM accounts a
LEFT JOIN account_ledger al ON a.id = al.account_id
GROUP BY a.id, a.account_name;
```

### View transactions:
```sql
SELECT 
    al.id,
    a.account_name,
    al.amount,
    al.narration,
    al.transaction_date
FROM account_ledger al
JOIN accounts a ON al.account_id = a.id
ORDER BY al.transaction_date DESC;
```

## Database Management

### Backup the database:
```bash
pg_dump -h localhost -p 5432 -U admin elephant_book > backup.sql
```

### Restore the database:
```bash
psql -h localhost -p 5432 -U admin elephant_book < backup.sql
```

### Check database size:
```sql
SELECT pg_size_pretty(pg_database_size('elephant_book'));
```

## Notes

- The database is running locally on your computer
- All data is stored on your machine
- Make sure PostgreSQL service is running: `brew services list` (on macOS) or `sudo systemctl status postgresql` (on Linux)
- The database tables were created automatically when you ran `init_db.py`



