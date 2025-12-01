#!/bin/bash

# ================================================
# KAYAK PLATFORM - AWS DEPLOYMENT SCRIPT
# ================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION="${AWS_REGION:-us-west-2}"
ENVIRONMENT="${ENVIRONMENT:-production}"
STACK_NAME="kayak-platform-${ENVIRONMENT}"
DB_PASSWORD="${DB_PASSWORD:-KayakSecure2024!}"

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}   KAYAK PLATFORM - AWS DEPLOYMENT${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo -e "${YELLOW}Region: ${AWS_REGION}${NC}"
echo -e "${YELLOW}Environment: ${ENVIRONMENT}${NC}"
echo -e "${YELLOW}Stack: ${STACK_NAME}${NC}"
echo ""

# Check prerequisites
echo -e "${BLUE}[1/7] Checking prerequisites...${NC}"
command -v aws >/dev/null 2>&1 || { echo -e "${RED}AWS CLI is required but not installed.${NC}" >&2; exit 1; }
command -v docker >/dev/null 2>&1 || { echo -e "${RED}Docker is required but not installed.${NC}" >&2; exit 1; }

# Verify AWS credentials
aws sts get-caller-identity > /dev/null 2>&1 || { echo -e "${RED}AWS credentials not configured.${NC}" >&2; exit 1; }
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✓ AWS Account: ${AWS_ACCOUNT_ID}${NC}"

# Deploy CloudFormation stack
echo ""
echo -e "${BLUE}[2/7] Deploying CloudFormation infrastructure...${NC}"
aws cloudformation deploy \
    --template-file ../cloudformation/infrastructure.yaml \
    --stack-name ${STACK_NAME} \
    --parameter-overrides \
        Environment=${ENVIRONMENT} \
        DBMasterPassword=${DB_PASSWORD} \
    --capabilities CAPABILITY_NAMED_IAM \
    --region ${AWS_REGION} \
    --no-fail-on-empty-changeset

echo -e "${GREEN}✓ Infrastructure deployed${NC}"

# Get outputs from CloudFormation
echo ""
echo -e "${BLUE}[3/7] Retrieving infrastructure outputs...${NC}"
MYSQL_ENDPOINT=$(aws cloudformation describe-stacks --stack-name ${STACK_NAME} --query "Stacks[0].Outputs[?OutputKey=='MySQLEndpoint'].OutputValue" --output text --region ${AWS_REGION})
REDIS_ENDPOINT=$(aws cloudformation describe-stacks --stack-name ${STACK_NAME} --query "Stacks[0].Outputs[?OutputKey=='RedisEndpoint'].OutputValue" --output text --region ${AWS_REGION})
ALB_DNS=$(aws cloudformation describe-stacks --stack-name ${STACK_NAME} --query "Stacks[0].Outputs[?OutputKey=='ALBDNSName'].OutputValue" --output text --region ${AWS_REGION})
ECS_CLUSTER=$(aws cloudformation describe-stacks --stack-name ${STACK_NAME} --query "Stacks[0].Outputs[?OutputKey=='ECSClusterName'].OutputValue" --output text --region ${AWS_REGION})

echo -e "${GREEN}✓ MySQL: ${MYSQL_ENDPOINT}${NC}"
echo -e "${GREEN}✓ Redis: ${REDIS_ENDPOINT}${NC}"
echo -e "${GREEN}✓ ALB: ${ALB_DNS}${NC}"

# Create secrets in AWS Secrets Manager
echo ""
echo -e "${BLUE}[4/7] Creating secrets in Secrets Manager...${NC}"

# MySQL secret
aws secretsmanager create-secret \
    --name kayak/mysql \
    --secret-string "{\"host\":\"${MYSQL_ENDPOINT}\",\"port\":\"3306\",\"username\":\"kayak_admin\",\"password\":\"${DB_PASSWORD}\",\"database\":\"kayak_db\"}" \
    --region ${AWS_REGION} 2>/dev/null || \
aws secretsmanager update-secret \
    --secret-id kayak/mysql \
    --secret-string "{\"host\":\"${MYSQL_ENDPOINT}\",\"port\":\"3306\",\"username\":\"kayak_admin\",\"password\":\"${DB_PASSWORD}\",\"database\":\"kayak_db\"}" \
    --region ${AWS_REGION}

# Redis secret
aws secretsmanager create-secret \
    --name kayak/redis \
    --secret-string "{\"host\":\"${REDIS_ENDPOINT}\",\"port\":\"6379\"}" \
    --region ${AWS_REGION} 2>/dev/null || \
aws secretsmanager update-secret \
    --secret-id kayak/redis \
    --secret-string "{\"host\":\"${REDIS_ENDPOINT}\",\"port\":\"6379\"}" \
    --region ${AWS_REGION}

# JWT secret
aws secretsmanager create-secret \
    --name kayak/jwt \
    --secret-string "{\"secret\":\"kayak_jwt_super_secret_key_2024_aws\"}" \
    --region ${AWS_REGION} 2>/dev/null || \
aws secretsmanager update-secret \
    --secret-id kayak/jwt \
    --secret-string "{\"secret\":\"kayak_jwt_super_secret_key_2024_aws\"}" \
    --region ${AWS_REGION}

echo -e "${GREEN}✓ Secrets created/updated${NC}"

# Login to ECR
echo ""
echo -e "${BLUE}[5/7] Logging into ECR...${NC}"
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
echo -e "${GREEN}✓ ECR login successful${NC}"

# Build and push Docker images
echo ""
echo -e "${BLUE}[6/7] Building and pushing Docker images...${NC}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"

# Admin Backend
echo -e "${YELLOW}Building admin-backend...${NC}"
docker build -t kayak-admin-backend:latest ${PROJECT_ROOT}/backend
docker tag kayak-admin-backend:latest ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/kayak-admin-backend:latest
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/kayak-admin-backend:latest
echo -e "${GREEN}✓ admin-backend pushed${NC}"

# Billing Service
echo -e "${YELLOW}Building billing-service...${NC}"
docker build -t kayak-billing-service:latest ${PROJECT_ROOT}/backend/billing
docker tag kayak-billing-service:latest ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/kayak-billing-service:latest
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/kayak-billing-service:latest
echo -e "${GREEN}✓ billing-service pushed${NC}"

# Admin Frontend
echo -e "${YELLOW}Building admin-frontend...${NC}"
docker build -t kayak-admin-frontend:latest ${PROJECT_ROOT}/frontend
docker tag kayak-admin-frontend:latest ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/kayak-admin-frontend:latest
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/kayak-admin-frontend:latest
echo -e "${GREEN}✓ admin-frontend pushed${NC}"

# Deploy ECS services
echo ""
echo -e "${BLUE}[7/7] Deploying ECS services...${NC}"

# Register task definitions
for service in admin-backend billing-service admin-frontend; do
    TASK_DEF=$(cat ../ecs-task-definitions/${service}.json | \
        sed "s/\${AWS_ACCOUNT_ID}/${AWS_ACCOUNT_ID}/g" | \
        sed "s/\${AWS_REGION}/${AWS_REGION}/g")
    
    echo "$TASK_DEF" > /tmp/${service}-task.json
    aws ecs register-task-definition --cli-input-json file:///tmp/${service}-task.json --region ${AWS_REGION} > /dev/null
    echo -e "${GREEN}✓ Registered task definition: ${service}${NC}"
done

# Get VPC and subnet info
VPC_ID=$(aws cloudformation describe-stacks --stack-name ${STACK_NAME} --query "Stacks[0].Outputs[?OutputKey=='VPCId'].OutputValue" --output text --region ${AWS_REGION})
SUBNETS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=${VPC_ID}" "Name=tag:Name,Values=*private*" --query "Subnets[*].SubnetId" --output text --region ${AWS_REGION} | tr '\t' ',')
ECS_SG=$(aws ec2 describe-security-groups --filters "Name=vpc-id,Values=${VPC_ID}" "Name=group-name,Values=*ecs*" --query "SecurityGroups[0].GroupId" --output text --region ${AWS_REGION})

# Create/Update ECS services
for service in admin-backend billing-service admin-frontend; do
    FAMILY="kayak-${service}"
    SERVICE_NAME="kayak-${service}-service"
    
    # Check if service exists
    if aws ecs describe-services --cluster ${ECS_CLUSTER} --services ${SERVICE_NAME} --region ${AWS_REGION} | grep -q "ACTIVE"; then
        echo -e "${YELLOW}Updating service: ${SERVICE_NAME}${NC}"
        aws ecs update-service \
            --cluster ${ECS_CLUSTER} \
            --service ${SERVICE_NAME} \
            --task-definition ${FAMILY} \
            --force-new-deployment \
            --region ${AWS_REGION} > /dev/null
    else
        echo -e "${YELLOW}Creating service: ${SERVICE_NAME}${NC}"
        
        # Determine target group based on service
        if [ "$service" == "admin-frontend" ]; then
            TG_NAME="kayak-frontend-tg-${ENVIRONMENT}"
            CONTAINER_PORT=80
        elif [ "$service" == "admin-backend" ]; then
            TG_NAME="kayak-backend-tg-${ENVIRONMENT}"
            CONTAINER_PORT=5001
        else
            TG_NAME="kayak-billing-tg-${ENVIRONMENT}"
            CONTAINER_PORT=5002
        fi
        
        TG_ARN=$(aws elbv2 describe-target-groups --names ${TG_NAME} --region ${AWS_REGION} --query "TargetGroups[0].TargetGroupArn" --output text 2>/dev/null || echo "")
        
        if [ -n "$TG_ARN" ] && [ "$TG_ARN" != "None" ]; then
            aws ecs create-service \
                --cluster ${ECS_CLUSTER} \
                --service-name ${SERVICE_NAME} \
                --task-definition ${FAMILY} \
                --desired-count 1 \
                --launch-type FARGATE \
                --network-configuration "awsvpcConfiguration={subnets=[${SUBNETS}],securityGroups=[${ECS_SG}],assignPublicIp=DISABLED}" \
                --load-balancers "targetGroupArn=${TG_ARN},containerName=${service},containerPort=${CONTAINER_PORT}" \
                --region ${AWS_REGION} > /dev/null
        else
            aws ecs create-service \
                --cluster ${ECS_CLUSTER} \
                --service-name ${SERVICE_NAME} \
                --task-definition ${FAMILY} \
                --desired-count 1 \
                --launch-type FARGATE \
                --network-configuration "awsvpcConfiguration={subnets=[${SUBNETS}],securityGroups=[${ECS_SG}],assignPublicIp=DISABLED}" \
                --region ${AWS_REGION} > /dev/null
        fi
    fi
    echo -e "${GREEN}✓ Service deployed: ${SERVICE_NAME}${NC}"
done

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}   DEPLOYMENT COMPLETE!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "${BLUE}Application URL: http://${ALB_DNS}${NC}"
echo -e "${BLUE}API Endpoint: http://${ALB_DNS}/api${NC}"
echo ""
echo -e "${YELLOW}Note: Services may take 2-3 minutes to become healthy${NC}"
echo ""
echo -e "To check service status:"
echo -e "  aws ecs describe-services --cluster ${ECS_CLUSTER} --services kayak-admin-backend-service kayak-billing-service-service kayak-admin-frontend-service --region ${AWS_REGION}"

