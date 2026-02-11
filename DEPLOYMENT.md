# 🚀 Deployment Guide

## Quick Start (Local Development)

### Prerequisites
- Docker Desktop installed and running
- Git installed

### Steps

1. **Clone and Navigate**
```bash
cd d:\SEM-8\multi-cloud
```

2. **Start All Services**
```bash
docker-compose up -d --build
```

3. **Access the Application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/docs
- PostgreSQL: localhost:5432
- Redis: localhost:6379

4. **Stop Services**
```bash
docker-compose down
```

---

## Production Deployment

### Option 1: Docker Compose (Single Server)

1. **Update Environment Variables**
Create `backend/.env.production`:
```env
DATABASE_URL=postgresql://user:STRONG_PASSWORD@db/multicloud
REDIS_URL=redis://redis:6379/0
SECRET_KEY=GENERATE_STRONG_SECRET_KEY_HERE
ENVIRONMENT=production
```

2. **Use Production Compose File**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Option 2: AWS Deployment

#### Using EC2 + Docker

1. **Launch EC2 Instance**
   - Instance Type: t3.medium or larger
   - OS: Ubuntu 22.04 LTS
   - Security Group: Open ports 80, 443, 22

2. **Install Docker**
```bash
sudo apt update
sudo apt install -y docker.io docker-compose
sudo systemctl enable docker
sudo systemctl start docker
```

3. **Deploy Application**
```bash
git clone https://github.com/PriyanshuKSharma/multi-cloud
cd multi-cloud
docker-compose -f docker-compose.prod.yml up -d
```

4. **Setup Nginx Reverse Proxy**
```bash
sudo apt install nginx
sudo nano /etc/nginx/sites-available/multicloud
```

Add configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/multicloud /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Option 3: Cloud Platform Deployment

#### Heroku
```bash
heroku create your-app-name
heroku addons:create heroku-postgresql:hobby-dev
heroku addons:create heroku-redis:hobby-dev
git push heroku main
```

#### Railway
1. Connect GitHub repository
2. Add PostgreSQL and Redis services
3. Set environment variables
4. Deploy automatically

#### DigitalOcean App Platform
1. Create new app from GitHub
2. Add managed PostgreSQL and Redis
3. Configure environment variables
4. Deploy

---

## Environment Variables

### Backend
```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
REDIS_URL=redis://host:6379/0
SECRET_KEY=your-secret-key-min-32-chars
ENVIRONMENT=production
AWS_ACCESS_KEY_ID=optional-for-terraform
AWS_SECRET_ACCESS_KEY=optional-for-terraform
```

### Frontend
```env
VITE_API_URL=https://your-backend-url.com
```

---

## Security Checklist

- [ ] Change default database password
- [ ] Generate strong SECRET_KEY (32+ characters)
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure CORS properly
- [ ] Set up firewall rules
- [ ] Enable database backups
- [ ] Implement rate limiting
- [ ] Use environment-specific configs
- [ ] Secure cloud provider credentials

---

## Monitoring & Logs

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f celery_worker
```

### Health Checks
- Backend: http://localhost:8000/health
- Database: `docker-compose exec db pg_isready`
- Redis: `docker-compose exec redis redis-cli ping`

---

## Backup & Recovery

### Database Backup
```bash
docker-compose exec db pg_dump -U user multicloud > backup.sql
```

### Database Restore
```bash
docker-compose exec -T db psql -U user multicloud < backup.sql
```

---

## Troubleshooting

### Port Already in Use
```bash
# Find process using port
netstat -ano | findstr :5173
# Kill process
taskkill /PID <PID> /F
```

### Container Won't Start
```bash
docker-compose down -v
docker-compose up -d --build
```

### Database Connection Issues
```bash
docker-compose exec backend python -c "from app.db.database import engine; print(engine)"
```

---

## Performance Optimization

1. **Enable Redis Caching**
2. **Use CDN for Frontend Assets**
3. **Optimize Database Queries**
4. **Enable Gzip Compression**
5. **Use Production Build for Frontend**
6. **Scale Celery Workers Horizontally**

---

## Scaling

### Horizontal Scaling
```bash
docker-compose up -d --scale celery_worker=3
```

### Load Balancing
Use Nginx or cloud load balancers to distribute traffic across multiple backend instances.
