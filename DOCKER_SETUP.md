# Docker Deployment Guide

This guide will help you deploy the Elephant Book application using Docker.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose (usually included with Docker Desktop)

## Quick Start

1. **Stop any running services** (if you have them running locally):
   ```bash
   # Stop local PostgreSQL if running
   brew services stop postgresql@14
   
   # Stop any running backend/frontend processes
   ```

2. **Build and start all services**:
   ```bash
   docker-compose up --build
   ```

   This will:
   - Build the backend Docker image
   - Build the frontend Docker image
   - Start PostgreSQL database container
   - Start backend API container
   - Start frontend container
   - Initialize the database tables

3. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs
   - Database: localhost:5432

## Docker Commands

### Start services (in background):
```bash
docker-compose up -d
```

### Stop services:
```bash
docker-compose down
```

### Stop and remove volumes (deletes database data):
```bash
docker-compose down -v
```

### View logs:
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

### Rebuild after code changes:
```bash
docker-compose up --build
```

### Execute commands in containers:
```bash
# Backend container
docker-compose exec backend bash

# Database container
docker-compose exec db psql -U admin -d elephant_book
```

## Services

### 1. Database (PostgreSQL)
- **Container**: `elephant_book_db`
- **Port**: 5432
- **Database**: elephant_book
- **User**: admin
- **Password**: Meera@2005
- **Volume**: `postgres_data` (persists data)

### 2. Backend (FastAPI)
- **Container**: `elephant_book_backend`
- **Port**: 8000
- **Auto-reload**: Enabled (for development)
- **Database initialization**: Runs automatically on startup

### 3. Frontend (React + Nginx)
- **Container**: `elephant_book_frontend`
- **Port**: 3000
- **Served by**: Nginx
- **API URL**: Configured to connect to backend

## Development Mode

The docker-compose.yml is configured for development with:
- Hot reload for backend (code changes auto-reload)
- Volume mounts for live code editing
- Development-friendly settings

## Production Mode

For production deployment, you should:

1. **Update docker-compose.prod.yml** (create this file):
   ```yaml
   version: '3.8'
   services:
     backend:
       command: uvicorn main:app --host 0.0.0.0 --port 8000
       # Remove --reload flag
     frontend:
       build:
         args:
           - VITE_API_URL=https://your-api-domain.com
   ```

2. **Use environment variables** for sensitive data
3. **Enable HTTPS** with reverse proxy (nginx/traefik)
4. **Set up proper secrets management**

## Troubleshooting

### Port already in use:
```bash
# Check what's using the port
lsof -i :8000
lsof -i :3000
lsof -i :5432

# Stop conflicting services
```

### Database connection issues:
```bash
# Check database logs
docker-compose logs db

# Test database connection
docker-compose exec db psql -U admin -d elephant_book -c "SELECT 1;"
```

### Backend not starting:
```bash
# Check backend logs
docker-compose logs backend

# Rebuild backend
docker-compose build backend
docker-compose up backend
```

### Frontend can't connect to backend:
- Ensure backend is running: `docker-compose ps`
- Check backend logs: `docker-compose logs backend`
- Verify API URL in frontend build

### Reset everything:
```bash
# Stop and remove all containers, networks, and volumes
docker-compose down -v

# Remove images (optional)
docker-compose down --rmi all

# Start fresh
docker-compose up --build
```

## Data Persistence

Database data is stored in a Docker volume named `postgres_data`. To backup:

```bash
# Backup database
docker-compose exec db pg_dump -U admin elephant_book > backup.sql

# Restore database
docker-compose exec -T db psql -U admin elephant_book < backup.sql
```

## Network

All services are on the `elephant_book_network` bridge network and can communicate using service names:
- Backend → Database: `db:5432`
- Frontend → Backend: `backend:8000` (or `localhost:8000` from host)

## Health Checks

All services have health checks configured:
- Database: Checks if PostgreSQL is ready
- Backend: Checks if API responds
- Frontend: Nginx automatically handles this

## Monitoring

View container status:
```bash
docker-compose ps
```

View resource usage:
```bash
docker stats
```



