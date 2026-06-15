# Hermes AI — AWS Migration & Growth Plan

> **Goal:** Use this project to learn AWS properly, add real skills to your resume, and build CI/CD. Each phase is ordered so that what you learn in one phase is a prerequisite for the next.

---

## Where You Are Now

- Monolith on Render (Express serves API + React frontend)
- MongoDB Atlas for database
- No tests, no CI/CD pipeline
- All bugs and security issues fixed (as of June 2026)

---

## Phase 0 — Tests + CI/CD on Render (Do This First)

**Why first:** You'll use GitHub Actions in every AWS phase. Learn it now while the deployment target is simple. Also, having tests means your CI/CD pipeline is actually guarding something.

### 0.1 Write Integration Tests

Tech: **Vitest + Supertest + mongodb-memory-server**

Install (inside `server/`):
```bash
npm install -D vitest supertest mongodb-memory-server
```

Tests to write:
1. `POST /api/embed/chat/send` with valid businessId → 200 + bot reply (use FAQ path, no AI mock needed)
2. `POST /api/embed/chat/send` with fake businessId → 404
3. `GET /api/auth/me` without cookie → 401

Update `server/package.json`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

### 0.2 GitHub Actions CI

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
        working-directory: server
      - run: npm test
        working-directory: server
```

Render already auto-deploys from `main`. Now it only deploys if tests pass (you configure this in Render's deploy settings — set the branch to trigger only after GitHub Actions succeeds, or just let it deploy and rely on the fact that broken code will fail tests visibly).

**Resume skills added:** GitHub Actions, integration testing, Vitest

---

## Phase 1 — AWS EC2 (Manual Deployment)

**Why:** EC2 is the foundation. Every AWS certification, every DevOps role, every interview assumes you know how to launch and manage a Linux server. Don't skip this by jumping to higher-level services.

**Free tier:** t2.micro, 750 hours/month, free for 12 months.

### 1.1 Launch EC2 Instance

- AWS Console → EC2 → Launch Instance
- OS: Ubuntu 22.04 LTS
- Instance type: t2.micro (free tier)
- Key pair: create one, download the `.pem` file (you need this to SSH in)
- Security Group rules:
  ```
  Port 22   (SSH)   — your IP only
  Port 80   (HTTP)  — anywhere
  Port 443  (HTTPS) — anywhere
  ```
- Allocate an **Elastic IP** and attach it to the instance (otherwise the IP changes on restart)

### 1.2 Server Setup (SSH in and run these)

```bash
ssh -i your-key.pem ubuntu@YOUR_ELASTIC_IP

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 (keeps Node running, restarts on crash)
sudo npm install -g pm2

# Install nginx (reverse proxy — handles HTTPS, forwards to Node)
sudo apt install -y nginx

# Install Certbot (free SSL from Let's Encrypt)
sudo apt install -y certbot python3-certbot-nginx
```

### 1.3 nginx Configuration

nginx sits in front of your Node app. Browsers connect to nginx on port 443 (HTTPS), nginx forwards the request to Node on port 5000 internally.

Create `/etc/nginx/sites-available/hermes`:
```nginx
server {
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable it:
```bash
sudo ln -s /etc/nginx/sites-available/hermes /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Get SSL certificate:
```bash
sudo certbot --nginx -d yourdomain.com
```

Certbot auto-renews — you don't need to think about SSL again.

### 1.4 Deploy the App

```bash
# Clone your repo
git clone https://github.com/yourusername/hermes-ai.git
cd hermes-ai

# Install dependencies
npm install
cd client && npm install && npm run build && cd ..
cd server && npm install && cd ..

# Create .env file
nano server/.env
# Add: MONGO_URI, JWT_SECRET, GROQ_API_KEY, etc.

# Start with PM2
pm2 start server/server.js --name hermes
pm2 save
pm2 startup  # Makes PM2 restart on server reboot
```

📝 **What you've learned:** Linux server management, nginx reverse proxy, SSL, PM2 process management, security groups, Elastic IPs. This is exactly what "server management" means in job descriptions.

**Resume skills added:** EC2, Linux, nginx, PM2, SSL/TLS, IAM basics

---

## Phase 2 — S3 for PDF Uploads

**Why:** Right now PDFs get parsed and only the text is saved to MongoDB. Moving the actual file storage to S3 is a natural improvement and teaches you the most-used AWS service.

**Free tier:** 5GB storage, 20,000 GET requests, 2,000 PUT requests — free forever.

### 2.1 Create an S3 Bucket

- AWS Console → S3 → Create Bucket
- Name: `hermes-ai-uploads` (must be globally unique)
- Region: same as your EC2
- Block all public access: ON (files accessed via signed URLs, not public)

### 2.2 IAM Role for EC2

Instead of putting AWS credentials in your `.env`, give the EC2 instance an IAM Role that allows S3 access. This is the correct, secure approach.

- IAM → Roles → Create Role → AWS Service → EC2
- Attach policy: `AmazonS3FullAccess` (or a custom policy scoped to your bucket only — more secure)
- Attach the role to your EC2 instance

Now your Node app can use the AWS SDK without any credentials in code.

### 2.3 Code Changes

Install:
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

In `botConfigController.js`, instead of extracting PDF text and storing it in BotConfig:
- Upload the file buffer to S3 with a unique key
- Store the S3 key in BotConfig
- When the bot needs the knowledge, download from S3 on demand (or cache it)

📝 **What you've learned:** S3 buckets, IAM roles vs IAM users, least-privilege access, AWS SDK v3, presigned URLs. IAM is tested in every AWS certification and asked about in every DevOps interview.

**Resume skills added:** S3, IAM roles, AWS SDK

---

## Phase 3 — GitHub Actions CD to EC2

**Why:** Right now deploying means SSH-ing in and running `git pull` manually. Automating this is CI/CD.

### 3.1 SSH Deploy Workflow

Add to `.github/workflows/deploy.yml`:

```yaml
name: Deploy to EC2

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
        working-directory: server
      - run: npm test
        working-directory: server

  deploy:
    needs: test          # Only runs if tests pass
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ubuntu
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            cd hermes-ai
            git pull origin main
            npm ci --prefix server
            npm run build --prefix client
            pm2 restart hermes
```

Add secrets in GitHub repo settings:
- `EC2_HOST` — your Elastic IP
- `EC2_SSH_KEY` — contents of your `.pem` file

📝 **What you've learned:** CD pipelines, GitHub Actions secrets, SSH automation, deployment gates (deploy only if tests pass).

### 3.2 Alternative: AWS CodeDeploy (More Resume Value for AWS Roles)

If you want to go deeper into AWS-native CI/CD:
- CodePipeline (orchestrator) → CodeBuild (runs tests/build) → CodeDeploy (deploys to EC2)
- More complex to set up but directly maps to what AWS-focused companies use
- Looks better if you're targeting AWS DevOps Engineer roles specifically

**Resume skills added:** CI/CD pipelines, deployment automation, GitHub Actions secrets management

---

## Phase 4 — Docker + ECR

**Why:** Containers are the industry standard for deploying Node apps. Docker makes your app run identically everywhere — your laptop, CI, production.

### 4.1 Write a Dockerfile

Create `Dockerfile` at the root:

```dockerfile
FROM node:22-alpine

WORKDIR /app

# Install server dependencies
COPY server/package*.json ./server/
RUN npm ci --prefix server --production

# Install and build client
COPY client/package*.json ./client/
RUN npm ci --prefix client
COPY client/ ./client/
RUN npm run build --prefix client

# Copy server source
COPY server/ ./server/

EXPOSE 5000
CMD ["node", "server/server.js"]
```

Test locally:
```bash
docker build -t hermes-ai .
docker run -p 5000:5000 --env-file server/.env hermes-ai
```

### 4.2 Push to ECR

ECR is AWS's private Docker registry.

```bash
# Create repository in ECR console, then:
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

docker tag hermes-ai:latest YOUR_ECR_URI/hermes-ai:latest
docker push YOUR_ECR_URI/hermes-ai:latest
```

**Free tier:** 500MB/month free for private repositories.

📝 **What you've learned:** Docker, multi-stage builds, ECR, container registries. Docker is listed in nearly every backend/DevOps job posting.

**Resume skills added:** Docker, ECR, containerization

---

## Phase 5 — ECS Fargate

**Why:** ECS Fargate runs your Docker container without you managing EC2 servers. AWS handles patching, scaling, and availability. This is how most modern AWS deployments work.

📝 **Fargate vs EC2:** With EC2 you manage the server (Phase 1). With Fargate, you just define how much CPU/memory your container needs and AWS runs it. You pay per second of compute, no idle server cost.

### 5.1 Key Concepts

- **Task Definition:** Blueprint for your container (image, CPU, memory, env vars, ports)
- **Service:** Keeps N copies of your task running (set to 1 for this project)
- **Cluster:** Logical grouping of services

### 5.2 Setup Steps (High Level)

1. Create ECS Cluster (Fargate type)
2. Create Task Definition pointing to your ECR image
3. Set environment variables in Task Definition (or use Secrets Manager)
4. Create ECS Service from the Task Definition
5. Attach an Application Load Balancer (handles HTTPS, routes to your containers)
6. Point Route 53 at the ALB

### 5.3 Update CI/CD

Update the deploy step in GitHub Actions to push a new image to ECR and update the ECS service:

```yaml
- name: Deploy to ECS
  run: |
    aws ecs update-service \
      --cluster hermes-cluster \
      --service hermes-service \
      --force-new-deployment
```

📝 **Cost note:** ECS Fargate is not free tier. A single 0.25 vCPU / 0.5GB task runs ~$9/month. After your EC2 free tier expires (12 months), this is comparable cost with less maintenance.

**Resume skills added:** ECS, Fargate, Task Definitions, ALB, container orchestration

---

## Phase 6 — CloudWatch Monitoring

**Why:** You can't debug production issues without logs and metrics. CloudWatch is already built into every AWS service.

### 6.1 What to Set Up

**Logs:** Configure ECS task to send stdout/stderr to CloudWatch Logs. No code change — just set `logConfiguration` in the Task Definition.

**Metrics to watch:**
- EC2/ECS: CPU utilization, memory usage
- ALB: request count, 4xx/5xx error rates, response time
- Custom: add metrics for AI calls, ticket creation rate

**Alarms:** Set a CloudWatch Alarm to notify you (via SNS → email) if:
- 5xx errors exceed 5% of requests
- CPU > 80% for 5 minutes

### 6.2 Add Grafana Cloud (Free Tier)

Once on ECS, install the **Grafana Agent** as a sidecar container in your Task Definition. It ships metrics to Grafana Cloud (free tier: 10k metrics, 50GB logs, 14-day retention).

Grafana gives you better dashboards than CloudWatch and is cloud-agnostic — the skill transfers to any company not on AWS.

📝 **CloudWatch vs Grafana on your resume:** List both. CloudWatch shows AWS depth. Grafana shows you understand monitoring independently of a cloud vendor.

**Resume skills added:** CloudWatch, monitoring, alerting, Grafana

---

## Phase 7 — Infrastructure as Code (Terraform)

**Why:** Clicking through the AWS console doesn't scale and can't be reviewed or repeated reliably. Terraform lets you define your entire infrastructure in code files, commit them to Git, and recreate the whole setup in any AWS account with one command. This is the skill that separates junior from mid/senior in DevOps roles.

### 7.1 What to Terraform

Start by writing Terraform for what you already have (Phase 1-5):
- VPC + subnets + security groups
- EC2 or ECS cluster + service
- S3 bucket + IAM roles
- ALB + Route 53 records
- CloudWatch log groups + alarms

### 7.2 Why Not AWS CDK?

CDK lets you write infrastructure in JavaScript/TypeScript instead of HCL (Terraform's language). It's valid and growing. But Terraform is cloud-agnostic and more widely used across companies that aren't AWS-only. If forced to choose one: Terraform.

**Resume skills added:** Terraform, IaC, HCL, reproducible infrastructure

---

## Monitoring Summary

| Phase | Tool | What It Watches |
|---|---|---|
| 0 (Render) | Render dashboard | Basic logs |
| 1-3 (EC2) | CloudWatch basic | CPU, network, logs |
| 4-5 (ECS) | CloudWatch + Grafana Cloud | Container metrics, custom dashboards |
| 6+ | CloudWatch Alarms + SNS | Automated alerts to email |

---

## Resume Snapshot (After All Phases)

```
Cloud & Infrastructure
  AWS: EC2, S3, ECS Fargate, ECR, ALB, Route 53,
       CloudWatch, IAM, Secrets Manager

Containerization
  Docker, ECR, ECS Fargate

CI/CD
  GitHub Actions, AWS CodeDeploy (optional)

Monitoring
  CloudWatch, Grafana, Prometheus (Grafana Agent)

Infrastructure as Code
  Terraform

Testing
  Vitest, Supertest, integration testing, mongodb-memory-server
```

---

## Rough Timeline

| Phase | Estimated Time | Priority |
|---|---|---|
| 0 — Tests + CI on Render | 1-2 days | Do now |
| 1 — EC2 manual deploy | 2-3 days | Next |
| 2 — S3 for PDFs | 1-2 days | After Phase 1 |
| 3 — CD to EC2 | 1 day | After Phase 2 |
| 4 — Docker + ECR | 2-3 days | After Phase 3 |
| 5 — ECS Fargate | 3-4 days | After Phase 4 |
| 6 — CloudWatch + Grafana | 1-2 days | Alongside Phase 5 |
| 7 — Terraform | 1-2 weeks | Last |

📝 **Don't rush.** Each phase done properly and understood is worth more than all phases done quickly and superficially. The goal is to be able to talk through every decision in an interview.
