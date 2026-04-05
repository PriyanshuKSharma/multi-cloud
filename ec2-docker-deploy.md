Below is a **single deployment script** that automates everything we did to deploy your **multi-cloud platform** on **Amazon Web Services EC2** using **Docker**, **Docker Compose**, and **Git**.

It will:

* install Git
* install Docker
* install Docker Compose
* install Docker Buildx
* clone your repo
* create `.env`
* start the containers

---

# 🚀 EC2 Deployment Script

Create the script:

```bash
nano deploy_multicloud.sh
```

Paste this:

```bash
#!/bin/bash

echo "Updating system..."
sudo yum update -y

echo "Installing Git..."
sudo yum install -y git

echo "Installing Docker..."
sudo yum install -y docker

echo "Starting Docker..."
sudo systemctl enable docker
sudo systemctl start docker

echo "Adding ec2-user to docker group..."
sudo usermod -aG docker ec2-user

echo "Installing Docker Compose..."
sudo curl -L https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
-o /usr/local/bin/docker-compose

sudo chmod +x /usr/local/bin/docker-compose

echo "Installing Docker Buildx..."
sudo mkdir -p /usr/libexec/docker/cli-plugins

sudo curl -L https://github.com/docker/buildx/releases/download/v0.17.1/buildx-v0.17.1.linux-amd64 \
-o /usr/libexec/docker/cli-plugins/docker-buildx

sudo chmod +x /usr/libexec/docker/cli-plugins/docker-buildx

echo "Restarting Docker..."
sudo systemctl restart docker

echo "Cloning project..."
cd ~
git clone https://github.com/PriyanshuKSharma/multi-cloud.git
cd multi-cloud

echo "Creating environment file..."

cat <<EOF > .env
SECRET_KEY=9c25ece73b1aca265d348ccd1aecb7b27210c0aba5d06e034a97d64314eb18be
POSTGRES_USER=user
POSTGRES_PASSWORD=password
POSTGRES_DB=multicloud
VITE_API_URL=http://65.2.55.74/api
EOF

echo "Starting Docker containers..."
docker-compose -f docker-compose.prod.yml up -d --build

echo "Deployment finished!"
echo "Open your app at: http://65.2.55.74"
```

---

# ▶️ Run the Script

Make executable:

```bash
chmod +x deploy_multicloud.sh
```

Run:

```bash
./deploy_multicloud.sh
```

---

# 📊 What the Script Sets Up

```
EC2 Instance
   │
   ├── Docker
   │     ├── Nginx
   │     ├── Frontend (Vite)
   │     ├── Backend (FastAPI)
   │     ├── Celery Worker
   │     ├── PostgreSQL
   │     └── Redis
   │
   └── Public Access
         http://65.2.55.74
```

---

# ⚠️ Important AWS Step

In **Amazon Web Services Security Group**, allow:

| Port | Purpose |
| ---- | ------- |
| 22   | SSH     |
| 80   | HTTP    |
| 443  | HTTPS   |

---

# ⭐ Optional Improvement (Recommended)

You can make the script **fully production ready** by adding:

* automatic SSL via **Let's Encrypt**
* automatic restart on reboot
* swap memory for small EC2 instances
* container health checks

---
