# 🚀 Production Deployment Checklist

## Pre-Deployment

### Security
- [ ] Change default database password in `.env`
- [ ] Generate strong SECRET_KEY (min 32 characters)
- [ ] Review and update CORS settings in backend
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure firewall rules (only allow 80, 443, 22)
- [ ] Disable debug mode in production
- [ ] Remove or secure API documentation endpoints (/docs, /redoc)
- [ ] Implement rate limiting
- [ ] Set up fail2ban for SSH protection

### Configuration
- [ ] Copy `.env.example` to `.env` and configure all variables
- [ ] Update `VITE_API_URL` to production backend URL
- [ ] Configure database connection pooling
- [ ] Set up Redis persistence
- [ ] Configure log rotation
- [ ] Set appropriate resource limits in docker-compose

### Infrastructure
- [ ] Provision server (min 2GB RAM, 2 CPU cores)
- [ ] Install Docker and Docker Compose
- [ ] Set up domain name and DNS records
- [ ] Configure reverse proxy (Nginx)
- [ ] Set up SSL certificates (Let's Encrypt)
- [ ] Configure backup strategy

## Deployment Steps

### 1. Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose -y

# Add user to docker group
sudo usermod -aG docker $USER
```

### 2. Application Deployment
```bash
# Clone repository
git clone https://github.com/PriyanshuKSharma/multi-cloud
cd multi-cloud

# Configure environment
cp .env.example .env
nano .env  # Edit with production values

# Deploy
docker-compose -f docker-compose.prod.yml up -d --build
```

### 3. SSL Setup (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## Post-Deployment

### Verification
- [ ] Test frontend loads correctly
- [ ] Test backend API endpoints
- [ ] Verify database connectivity
- [ ] Check Redis connection
- [ ] Test user registration and login
- [ ] Test resource provisioning (AWS/Azure/GCP)
- [ ] Verify Celery worker is processing tasks
- [ ] Check all logs for errors

### Monitoring
- [ ] Set up application monitoring (e.g., Prometheus, Grafana)
- [ ] Configure log aggregation (e.g., ELK stack)
- [ ] Set up uptime monitoring (e.g., UptimeRobot)
- [ ] Configure alerting for critical errors
- [ ] Monitor resource usage (CPU, RAM, Disk)

### Backup
- [ ] Configure automated database backups
- [ ] Test backup restoration process
- [ ] Set up off-site backup storage
- [ ] Document backup procedures

### Documentation
- [ ] Update README with production URLs
- [ ] Document deployment process
- [ ] Create runbook for common issues
- [ ] Document rollback procedures

## Maintenance

### Regular Tasks
- [ ] Weekly: Review logs for errors
- [ ] Weekly: Check disk space usage
- [ ] Monthly: Update dependencies
- [ ] Monthly: Review security patches
- [ ] Quarterly: Test backup restoration
- [ ] Quarterly: Review and update documentation

### Performance Optimization
- [ ] Enable Redis caching
- [ ] Optimize database queries
- [ ] Configure CDN for static assets
- [ ] Enable Gzip compression
- [ ] Implement database indexing
- [ ] Scale Celery workers as needed

## Rollback Plan

If deployment fails:
```bash
# Stop new deployment
docker-compose -f docker-compose.prod.yml down

# Restore from backup
docker-compose exec -T db psql -U user multicloud < backup.sql

# Start previous version
git checkout <previous-commit>
docker-compose -f docker-compose.prod.yml up -d
```

## Support Contacts

- DevOps Lead: [Name/Email]
- Backend Lead: [Name/Email]
- Frontend Lead: [Name/Email]
- Infrastructure: [Provider/Contact]

## Emergency Procedures

### Service Down
1. Check logs: `docker-compose logs -f`
2. Restart services: `docker-compose restart`
3. Check resource usage: `docker stats`
4. Review recent changes in git history

### Database Issues
1. Check connection: `docker-compose exec db pg_isready`
2. Review logs: `docker-compose logs db`
3. Restore from backup if corrupted

### High Load
1. Scale workers: `docker-compose up -d --scale celery_worker=5`
2. Check resource bottlenecks
3. Review and optimize slow queries
4. Consider horizontal scaling

---

**Last Updated:** [Date]
**Deployed By:** [Name]
**Version:** [Version Number]
