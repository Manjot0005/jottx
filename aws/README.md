# 🚀 AWS Deployment Guide - Kayak Platform

This guide covers deploying the Kayak Platform to AWS using ECS Fargate.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         AWS Cloud                                │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐                                                │
│  │   Route 53  │ ──► DNS                                        │
│  └──────┬──────┘                                                │
│         │                                                        │
│  ┌──────▼──────┐                                                │
│  │     ALB     │ ──► Application Load Balancer                  │
│  └──────┬──────┘                                                │
│         │                                                        │
│  ┌──────▼──────────────────────────────────────────┐            │
│  │              ECS Cluster (Fargate)               │            │
│  │  ┌─────────────┐ ┌───────────┐ ┌─────────────┐  │            │
│  │  │  Frontend   │ │  Backend  │ │   Billing   │  │            │
│  │  │  (Nginx)    │ │  (Node)   │ │   (Node)    │  │            │
│  │  └─────────────┘ └─────┬─────┘ └──────┬──────┘  │            │
│  └────────────────────────┼──────────────┼─────────┘            │
│                           │              │                       │
│  ┌────────────────────────▼──────────────▼─────────┐            │
│  │                   VPC (Private)                  │            │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │            │
│  │  │   RDS    │  │ ElastiC. │  │  DocumentDB  │   │            │
│  │  │  MySQL   │  │  Redis   │  │  (MongoDB)   │   │            │
│  │  └──────────┘  └──────────┘  └──────────────┘   │            │
│  └──────────────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

## Prerequisites

1. **AWS CLI** installed and configured
   ```bash
   brew install awscli
   aws configure
   ```

2. **Docker** installed and running

3. **AWS Account** with appropriate permissions:
   - ECS, ECR, RDS, ElastiCache
   - VPC, EC2, IAM
   - CloudFormation, Secrets Manager

## Quick Deploy

### Option 1: Automated Script

```bash
cd aws/scripts
chmod +x deploy.sh

# Set environment variables
export AWS_REGION=us-west-2
export ENVIRONMENT=production
export DB_PASSWORD=YourSecurePassword123!

# Run deployment
./deploy.sh
```

### Option 2: Step-by-Step Manual Deployment

#### Step 1: Deploy Infrastructure

```bash
aws cloudformation deploy \
    --template-file aws/cloudformation/infrastructure.yaml \
    --stack-name kayak-platform-production \
    --parameter-overrides \
        Environment=production \
        DBMasterPassword=YourSecurePassword123! \
    --capabilities CAPABILITY_NAMED_IAM \
    --region us-west-2
```

#### Step 2: Get Infrastructure Outputs

```bash
aws cloudformation describe-stacks \
    --stack-name kayak-platform-production \
    --query "Stacks[0].Outputs" \
    --output table
```

#### Step 3: Create Secrets

```bash
# Get endpoints from CloudFormation outputs
MYSQL_ENDPOINT=$(aws cloudformation describe-stacks --stack-name kayak-platform-production --query "Stacks[0].Outputs[?OutputKey=='MySQLEndpoint'].OutputValue" --output text)
REDIS_ENDPOINT=$(aws cloudformation describe-stacks --stack-name kayak-platform-production --query "Stacks[0].Outputs[?OutputKey=='RedisEndpoint'].OutputValue" --output text)

# Create secrets
aws secretsmanager create-secret \
    --name kayak/mysql \
    --secret-string '{"host":"'$MYSQL_ENDPOINT'","port":"3306","username":"kayak_admin","password":"YourPassword","database":"kayak_db"}'

aws secretsmanager create-secret \
    --name kayak/redis \
    --secret-string '{"host":"'$REDIS_ENDPOINT'","port":"6379"}'

aws secretsmanager create-secret \
    --name kayak/jwt \
    --secret-string '{"secret":"your-jwt-secret-key"}'
```

#### Step 4: Build and Push Docker Images

```bash
# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=us-west-2

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build and push admin-backend
docker build -t kayak-admin-backend ./backend
docker tag kayak-admin-backend:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/kayak-admin-backend:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/kayak-admin-backend:latest

# Build and push billing-service
docker build -t kayak-billing-service ./backend/billing
docker tag kayak-billing-service:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/kayak-billing-service:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/kayak-billing-service:latest

# Build and push admin-frontend
docker build -t kayak-admin-frontend ./frontend
docker tag kayak-admin-frontend:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/kayak-admin-frontend:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/kayak-admin-frontend:latest
```

#### Step 5: Register Task Definitions

```bash
# Replace placeholders in task definitions and register
for service in admin-backend billing-service admin-frontend; do
    sed -e "s/\${AWS_ACCOUNT_ID}/$AWS_ACCOUNT_ID/g" \
        -e "s/\${AWS_REGION}/$AWS_REGION/g" \
        aws/ecs-task-definitions/${service}.json > /tmp/${service}-task.json
    
    aws ecs register-task-definition --cli-input-json file:///tmp/${service}-task.json
done
```

#### Step 6: Create ECS Services

```bash
ECS_CLUSTER=kayak-cluster-production

# Create services (simplified example)
aws ecs create-service \
    --cluster $ECS_CLUSTER \
    --service-name kayak-admin-frontend-service \
    --task-definition kayak-admin-frontend \
    --desired-count 1 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=DISABLED}"
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `AWS_REGION` | AWS region for deployment | `us-west-2` |
| `ENVIRONMENT` | Environment name | `production` |
| `DB_PASSWORD` | MySQL master password | Required |

### Costs Estimate (Monthly)

| Service | Type | Estimated Cost |
|---------|------|----------------|
| ECS Fargate | 3 tasks (0.5 vCPU, 1GB) | ~$30 |
| RDS MySQL | db.t3.micro | ~$15 |
| ElastiCache | cache.t3.micro | ~$12 |
| ALB | Application LB | ~$16 |
| NAT Gateway | Per hour + data | ~$32 |
| ECR | Storage | ~$1 |
| **Total** | | **~$106/month** |

## Monitoring

### CloudWatch Logs

View logs for each service:
```bash
aws logs tail /ecs/kayak-admin-backend --follow
aws logs tail /ecs/kayak-billing-service --follow
aws logs tail /ecs/kayak-admin-frontend --follow
```

### ECS Service Status

```bash
aws ecs describe-services \
    --cluster kayak-cluster-production \
    --services kayak-admin-backend-service kayak-billing-service-service kayak-admin-frontend-service
```

## Cleanup

To delete all AWS resources:

```bash
# Delete ECS services first
aws ecs delete-service --cluster kayak-cluster-production --service kayak-admin-backend-service --force
aws ecs delete-service --cluster kayak-cluster-production --service kayak-billing-service-service --force
aws ecs delete-service --cluster kayak-cluster-production --service kayak-admin-frontend-service --force

# Wait for services to drain, then delete the stack
aws cloudformation delete-stack --stack-name kayak-platform-production

# Delete secrets
aws secretsmanager delete-secret --secret-id kayak/mysql --force-delete-without-recovery
aws secretsmanager delete-secret --secret-id kayak/redis --force-delete-without-recovery
aws secretsmanager delete-secret --secret-id kayak/jwt --force-delete-without-recovery

# Delete ECR images
for repo in kayak-admin-backend kayak-billing-service kayak-admin-frontend; do
    aws ecr delete-repository --repository-name $repo --force
done
```

## Troubleshooting

### Service Not Starting

1. Check task logs:
   ```bash
   aws logs tail /ecs/kayak-admin-backend --since 10m
   ```

2. Check task status:
   ```bash
   aws ecs describe-tasks --cluster kayak-cluster-production --tasks <task-id>
   ```

### Database Connection Issues

1. Verify security group rules allow ECS → RDS traffic
2. Check secrets are correctly configured
3. Verify RDS endpoint is accessible from private subnet

### Health Check Failures

1. Ensure health check endpoint returns 200
2. Check security groups allow ALB → ECS traffic
3. Verify container port mappings

## Security Best Practices

1. ✅ All databases in private subnets
2. ✅ Secrets stored in AWS Secrets Manager
3. ✅ IAM roles with least privilege
4. ✅ VPC with public/private subnet separation
5. ✅ Security groups with minimal access
6. ⬜ Enable HTTPS with ACM certificate
7. ⬜ Enable WAF on ALB
8. ⬜ Enable CloudTrail logging

