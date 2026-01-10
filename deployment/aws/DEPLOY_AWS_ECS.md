# Deploy dự án lên AWS - ECS Fargate & App Runner

## Tổng quan kiến trúc AWS
Dự án này sẽ deploy với các services AWS:
- **Backend API**: AWS App Runner hoặc ECS Fargate
- **NewsAnalyst Worker**: ECS Fargate + EventBridge Scheduler
- **Frontend**: AWS App Runner (Next.js)
- **Redis**: ElastiCache Redis
- **Database**: Supabase (external) hoặc RDS PostgreSQL

## So sánh GCP vs AWS

| GCP | AWS |
|-----|-----|
| Cloud Run | App Runner / ECS Fargate |
| Cloud Memorystore | ElastiCache |
| Artifact Registry | ECR (Elastic Container Registry) |
| Secret Manager | Secrets Manager |
| Cloud Scheduler | EventBridge Scheduler |
| VPC Connector | VPC & Security Groups |

## Bước 1: Chuẩn bị AWS CLI

### 1.1. Cài đặt AWS CLI
```powershell
# Download AWS CLI v2 cho Windows
# Từ: https://awscli.amazonaws.com/AWSCLIV2.msi

# Hoặc dùng winget
winget install Amazon.AWSCLI

# Verify
aws --version
```

### 1.2. Configure AWS credentials
```powershell
# Configure với Access Key và Secret Key
aws configure

# Nhập thông tin:
# AWS Access Key ID: YOUR_ACCESS_KEY
# AWS Secret Access Key: YOUR_SECRET_KEY
# Default region: ap-southeast-1  (Singapore - gần Việt Nam nhất)
# Default output format: json

# Test connection
aws sts get-caller-identity
```

### 1.3. Set biến môi trường
```powershell
$AWS_REGION = "ap-southeast-1"  # Singapore
$AWS_ACCOUNT_ID = (aws sts get-caller-identity --query Account --output text)
$PROJECT_NAME = "rag-finance"

Write-Host "AWS Account ID: $AWS_ACCOUNT_ID"
Write-Host "AWS Region: $AWS_REGION"
```

## Bước 2: Tạo VPC và Security Groups

### 2.1. Tạo VPC (nếu chưa có)
```powershell
# Kiểm tra VPC default
aws ec2 describe-vpcs --filters "Name=isDefault,Values=true"

# Nếu không có, tạo VPC mới
$VPC_ID = (aws ec2 create-vpc --cidr-block 10.0.0.0/16 --query 'Vpc.VpcId' --output text)

# Tạo subnets (cần ít nhất 2 subnets ở 2 AZ khác nhau)
$SUBNET1_ID = (aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.1.0/24 --availability-zone "${AWS_REGION}a" --query 'Subnet.SubnetId' --output text)
$SUBNET2_ID = (aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.2.0/24 --availability-zone "${AWS_REGION}b" --query 'Subnet.SubnetId' --output text)

# Enable auto-assign public IP
aws ec2 modify-subnet-attribute --subnet-id $SUBNET1_ID --map-public-ip-on-launch
aws ec2 modify-subnet-attribute --subnet-id $SUBNET2_ID --map-public-ip-on-launch

# Tạo Internet Gateway
$IGW_ID = (aws ec2 create-internet-gateway --query 'InternetGateway.InternetGatewayId' --output text)
aws ec2 attach-internet-gateway --vpc-id $VPC_ID --internet-gateway-id $IGW_ID

# Tạo route table
$RT_ID = (aws ec2 create-route-table --vpc-id $VPC_ID --query 'RouteTable.RouteTableId' --output text)
aws ec2 create-route --route-table-id $RT_ID --destination-cidr-block 0.0.0.0/0 --gateway-id $IGW_ID
aws ec2 associate-route-table --subnet-id $SUBNET1_ID --route-table-id $RT_ID
aws ec2 associate-route-table --subnet-id $SUBNET2_ID --route-table-id $RT_ID
```

### 2.2. Tạo Security Groups
```powershell
# Security group cho ECS tasks
$SG_ECS = (aws ec2 create-security-group --group-name "${PROJECT_NAME}-ecs-sg" --description "Security group for ECS tasks" --vpc-id $VPC_ID --query 'GroupId' --output text)

# Allow HTTP/HTTPS traffic
aws ec2 authorize-security-group-ingress --group-id $SG_ECS --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $SG_ECS --protocol tcp --port 443 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $SG_ECS --protocol tcp --port 8000 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $SG_ECS --protocol tcp --port 3000 --cidr 0.0.0.0/0

# Security group cho Redis
$SG_REDIS = (aws ec2 create-security-group --group-name "${PROJECT_NAME}-redis-sg" --description "Security group for Redis" --vpc-id $VPC_ID --query 'GroupId' --output text)

# Allow Redis port from ECS security group
aws ec2 authorize-security-group-ingress --group-id $SG_REDIS --protocol tcp --port 6379 --source-group $SG_ECS
```

## Bước 3: Tạo ElastiCache Redis

```powershell
# Tạo subnet group cho ElastiCache
aws elasticache create-cache-subnet-group --cache-subnet-group-name "${PROJECT_NAME}-redis-subnet" --cache-subnet-group-description "Subnet group for Redis" --subnet-ids $SUBNET1_ID $SUBNET2_ID

# Tạo Redis cluster (single node cho tiết kiệm)
aws elasticache create-cache-cluster --cache-cluster-id "${PROJECT_NAME}-redis" --cache-node-type cache.t3.micro --engine redis --engine-version 7.0 --num-cache-nodes 1 --cache-subnet-group-name "${PROJECT_NAME}-redis-subnet" --security-group-ids $SG_REDIS --preferred-maintenance-window sun:05:00-sun:06:00

# Lấy Redis endpoint (mất 5-10 phút để tạo)
Write-Host "Waiting for Redis cluster to be available..." -ForegroundColor Yellow
aws elasticache wait cache-cluster-available --cache-cluster-id "${PROJECT_NAME}-redis"

$REDIS_ENDPOINT = (aws elasticache describe-cache-clusters --cache-cluster-id "${PROJECT_NAME}-redis" --show-cache-node-info --query 'CacheClusters[0].CacheNodes[0].Endpoint.Address' --output text)
$REDIS_PORT = (aws elasticache describe-cache-clusters --cache-cluster-id "${PROJECT_NAME}-redis" --show-cache-node-info --query 'CacheClusters[0].CacheNodes[0].Endpoint.Port' --output text)

Write-Host "Redis Endpoint: ${REDIS_ENDPOINT}:${REDIS_PORT}" -ForegroundColor Green
```

## Bước 4: Tạo ECR Repositories

```powershell
# Tạo repositories cho backend và frontend
aws ecr create-repository --repository-name "${PROJECT_NAME}/backend" --region $AWS_REGION
aws ecr create-repository --repository-name "${PROJECT_NAME}/frontend" --region $AWS_REGION

# Get ECR login
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
```

## Bước 5: Setup Secrets Manager

```powershell
# Tạo secrets từ file .env
# Đọc file .env và tạo JSON object
$secrets = @{
    SUPABASE_URL = "your_supabase_url"
    SUPABASE_SERVICE_ROLE_KEY = "your_service_role_key"
    SUPABASE_ANON_KEY = "your_anon_key"
    GEMINI_API_KEY = "your_gemini_key"
    GOOGLE_CUSTOM_SEARCH_API_KEY = "your_search_key"
    GOOGLE_CUSTOM_SEARCH_ENGINE_ID = "your_search_engine_id"
    REDIS_URL = "redis://${REDIS_ENDPOINT}:${REDIS_PORT}"
} | ConvertTo-Json

# Tạo secret
aws secretsmanager create-secret --name "${PROJECT_NAME}/app-secrets" --secret-string $secrets --region $AWS_REGION

Write-Host "Secrets created successfully" -ForegroundColor Green
```

**Hoặc dùng script:**
```powershell
.\setup-secrets-aws.ps1 -ProjectName $PROJECT_NAME -Region $AWS_REGION
```

## Bước 6: Build và Push Docker Images

```powershell
# Backend
docker build -t "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${PROJECT_NAME}/backend:latest" .
docker push "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${PROJECT_NAME}/backend:latest"

# Frontend
cd frontend
docker build --build-arg NEXT_PUBLIC_API_URL=http://localhost:8000 -t "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${PROJECT_NAME}/frontend:latest" .
docker push "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${PROJECT_NAME}/frontend:latest"
cd ..
```

## Bước 7: Deploy với ECS Fargate

### 7.1. Tạo ECS Cluster
```powershell
aws ecs create-cluster --cluster-name "${PROJECT_NAME}-cluster" --region $AWS_REGION
```

### 7.2. Tạo IAM Role cho ECS Tasks
```powershell
# Tạo task execution role
$EXECUTION_ROLE_ARN = (aws iam create-role --role-name "${PROJECT_NAME}-ecs-execution-role" --assume-role-policy-document '{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
    "Action": "sts:AssumeRole"
  }]
}' --query 'Role.Arn' --output text)

# Attach policies
aws iam attach-role-policy --role-name "${PROJECT_NAME}-ecs-execution-role" --policy-arn "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
aws iam attach-role-policy --role-name "${PROJECT_NAME}-ecs-execution-role" --policy-arn "arn:aws:iam::aws:policy/SecretsManagerReadWrite"

# Tạo task role
$TASK_ROLE_ARN = (aws iam create-role --role-name "${PROJECT_NAME}-ecs-task-role" --assume-role-policy-document '{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
    "Action": "sts:AssumeRole"
  }]
}' --query 'Role.Arn' --output text)
```

### 7.3. Tạo Task Definitions
```powershell
# Backend task definition
@"
{
  "family": "${PROJECT_NAME}-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "${EXECUTION_ROLE_ARN}",
  "taskRoleArn": "${TASK_ROLE_ARN}",
  "containerDefinitions": [{
    "name": "backend",
    "image": "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${PROJECT_NAME}/backend:latest",
    "portMappings": [{"containerPort": 8000, "protocol": "tcp"}],
    "secrets": [{
      "name": "APP_SECRETS",
      "valueFrom": "arn:aws:secretsmanager:${AWS_REGION}:${AWS_ACCOUNT_ID}:secret:${PROJECT_NAME}/app-secrets"
    }],
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "/ecs/${PROJECT_NAME}/backend",
        "awslogs-region": "${AWS_REGION}",
        "awslogs-stream-prefix": "ecs"
      }
    }
  }]
}
"@ | Out-File -FilePath "backend-task-def.json" -Encoding utf8

# Tạo CloudWatch log group
aws logs create-log-group --log-group-name "/ecs/${PROJECT_NAME}/backend" --region $AWS_REGION

# Register task definition
aws ecs register-task-definition --cli-input-json file://backend-task-def.json --region $AWS_REGION
```

### 7.4. Tạo Application Load Balancer
```powershell
# Tạo ALB
$ALB_ARN = (aws elbv2 create-load-balancer --name "${PROJECT_NAME}-alb" --subnets $SUBNET1_ID $SUBNET2_ID --security-groups $SG_ECS --scheme internet-facing --type application --ip-address-type ipv4 --query 'LoadBalancers[0].LoadBalancerArn' --output text)

# Lấy ALB DNS
$ALB_DNS = (aws elbv2 describe-load-balancers --load-balancer-arns $ALB_ARN --query 'LoadBalancers[0].DNSName' --output text)
Write-Host "ALB DNS: $ALB_DNS" -ForegroundColor Green

# Tạo target group cho backend
$TG_BACKEND_ARN = (aws elbv2 create-target-group --name "${PROJECT_NAME}-backend-tg" --protocol HTTP --port 8000 --vpc-id $VPC_ID --target-type ip --health-check-path "/api/health" --query 'TargetGroups[0].TargetGroupArn' --output text)

# Tạo listener
aws elbv2 create-listener --load-balancer-arn $ALB_ARN --protocol HTTP --port 80 --default-actions "Type=forward,TargetGroupArn=${TG_BACKEND_ARN}"
```

### 7.5. Tạo ECS Service
```powershell
aws ecs create-service --cluster "${PROJECT_NAME}-cluster" --service-name "${PROJECT_NAME}-backend" --task-definition "${PROJECT_NAME}-backend" --desired-count 1 --launch-type FARGATE --network-configuration "awsvpcConfiguration={subnets=[$SUBNET1_ID,$SUBNET2_ID],securityGroups=[$SG_ECS],assignPublicIp=ENABLED}" --load-balancers "targetGroupArn=${TG_BACKEND_ARN},containerName=backend,containerPort=8000" --region $AWS_REGION

Write-Host "Backend service created" -ForegroundColor Green
Write-Host "Backend URL: http://${ALB_DNS}" -ForegroundColor Cyan
```

## Bước 8: Deploy Frontend với AWS App Runner

```powershell
# Rebuild frontend với backend URL
cd frontend
docker build --build-arg NEXT_PUBLIC_API_URL="http://${ALB_DNS}" -t "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${PROJECT_NAME}/frontend:latest" .
docker push "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${PROJECT_NAME}/frontend:latest"
cd ..

# Tạo App Runner service (đơn giản hơn ECS)
# Cần tạo qua console hoặc dùng CloudFormation
Write-Host "Deploy frontend via AWS Console:" -ForegroundColor Yellow
Write-Host "1. Go to AWS App Runner console" -ForegroundColor White
Write-Host "2. Create service from ECR" -ForegroundColor White
Write-Host "3. Image: ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${PROJECT_NAME}/frontend:latest" -ForegroundColor White
Write-Host "4. Port: 3000" -ForegroundColor White
```

## Bước 9: Setup EventBridge Scheduler cho NewsAnalyst

```powershell
# Tạo task definition cho NewsAnalyst
# (tương tự backend nhưng với command khác)

# Tạo EventBridge rule (chạy mỗi 4 giờ)
aws events put-rule --name "${PROJECT_NAME}-newsanalyst" --schedule-expression "rate(4 hours)" --state ENABLED --region $AWS_REGION

# Tạo target là ECS task
aws events put-targets --rule "${PROJECT_NAME}-newsanalyst" --targets "Id=1,Arn=arn:aws:ecs:${AWS_REGION}:${AWS_ACCOUNT_ID}:cluster/${PROJECT_NAME}-cluster,RoleArn=${EXECUTION_ROLE_ARN},EcsParameters={TaskDefinitionArn=arn:aws:ecs:${AWS_REGION}:${AWS_ACCOUNT_ID}:task-definition/${PROJECT_NAME}-newsanalyst:1,TaskCount=1,LaunchType=FARGATE,NetworkConfiguration={awsvpcConfiguration={subnets=[$SUBNET1_ID,$SUBNET2_ID],securityGroups=[$SG_ECS],assignPublicIp=ENABLED}}}" --region $AWS_REGION
```

## Chi phí ước tính (hàng tháng)

- **ECS Fargate Backend** (1 task, 1vCPU/2GB): ~$30-40
- **ECS Fargate NewsAnalyst** (scheduled): ~$5-10
- **App Runner Frontend**: ~$15-25
- **ElastiCache Redis** (t3.micro): ~$13
- **Application Load Balancer**: ~$16
- **Data Transfer**: ~$10-20
- **ECR Storage**: ~$1

**Tổng**: ~$90-125/tháng

## Tối ưu chi phí

1. **Dùng Fargate Spot**: Giảm 70% chi phí
2. **Auto-scaling**: Scale to 0 khi không dùng (App Runner)
3. **Reserved Instances**: Nếu chạy 24/7
4. **Dùng Upstash Redis**: Thay ElastiCache (serverless)

## Sử dụng script tự động

```powershell
# Deploy toàn bộ
.\deploy-aws.ps1 -ProjectName "rag-finance" -Region "ap-southeast-1"

# Chỉ deploy code
.\deploy-aws.ps1 -ProjectName "rag-finance" -SkipInfrastructure
```

## Rollback

```powershell
# Update service về revision trước
aws ecs update-service --cluster "${PROJECT_NAME}-cluster" --service "${PROJECT_NAME}-backend" --task-definition "${PROJECT_NAME}-backend:PREVIOUS_REVISION" --region $AWS_REGION
```

## Cleanup (xóa toàn bộ)

```powershell
.\cleanup-aws.ps1 -ProjectName "rag-finance" -Region "ap-southeast-1"
```
