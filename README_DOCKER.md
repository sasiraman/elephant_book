# 🐘 Elephant Book - Docker Deployment

## Quick Start

```bash
# Build and start all services
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

## Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Database**: localhost:5432

## Services

1. **PostgreSQL Database** (port 5432)
   - Database: `elephant_book`
   - User: `admin`
   - Password: `*********`

2. **FastAPI Backend** (port 8000)
   - Auto-initializes database tables
   - Hot reload enabled for development

3. **React Frontend** (port 3000)
   - Served by Nginx
   - Production build

## Common Commands

```bash
# Start services
docker-compose up

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild after code changes
docker-compose up --build

# Access database
docker-compose exec db psql -U admin -d elephant_book

# Access backend container
docker-compose exec backend bash
```

## Troubleshooting

If port conflicts occur, stop local services:
```bash
# macOS
brew services stop postgresql@14

# Check ports
lsof -i :8000
lsof -i :3000
lsof -i :5432
```

For detailed information, see [DOCKER_SETUP.md](./DOCKER_SETUP.md)




