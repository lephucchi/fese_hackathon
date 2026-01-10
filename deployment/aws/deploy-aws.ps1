# Deploy Multi-Index RAG Finance to AWS
# PowerShell script for Windows

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectName,
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "ap-southeast-1",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipBuild,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipInfrastructure
)

$ErrorActionPreference = "Stop"

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Deploy RAG Finance to AWS ECS" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Get AWS Account ID
$AWS_ACCOUNT_ID = (aws sts get-caller-identity --query Account --output text)
Write-Host "AWS Account ID: $AWS_ACCOUNT_ID" -ForegroundColor Green
Write-Host "AWS Region: $Region" -ForegroundColor Green
Write-Host ""

# Variables
$ECR_BACKEND = "${AWS_ACCOUNT_ID}.dkr.ecr.${Region}.amazonaws.com/${ProjectName}/backend"
$ECR_FRONTEND = "${AWS_ACCOUNT_ID}.dkr.ecr.${Region}.amazonaws.com/${ProjectName}/frontend"

# Create infrastructure
if (-not $SkipInfrastructure) {
    Write-Host "[1/10] Setting up VPC and Networking..." -ForegroundColor Yellow
    
    # Get default VPC
    $VPC_ID = (aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query 'Vpcs[0].VpcId' --output text --region $Region)
    
    if (-not $VPC_ID) {
        Write-Host "Creating VPC..." -ForegroundColor Yellow
        $VPC_ID = (aws ec2 create-vpc --cidr-block 10.0.0.0/16 --query 'Vpc.VpcId' --output text --region $Region)
        Start-Sleep -Seconds 5
    }
    
    Write-Host "  VPC ID: $VPC_ID" -ForegroundColor Gray
    
    # Get subnets
    $SUBNETS = (aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query 'Subnets[*].SubnetId' --output text --region $Region)
    $SUBNET_ARRAY = $SUBNETS -split '\s+'
    
    if ($SUBNET_ARRAY.Length -lt 2) {
        Write-Host "Creating subnets..." -ForegroundColor Yellow
        $SUBNET1_ID = (aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.1.0/24 --availability-zone "${Region}a" --query 'Subnet.SubnetId' --output text --region $Region)
        $SUBNET2_ID = (aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.2.0/24 --availability-zone "${Region}b" --query 'Subnet.SubnetId' --output text --region $Region)
        $SUBNET_ARRAY = @($SUBNET1_ID, $SUBNET2_ID)
    }
    
    Write-Host "  Subnets: $($SUBNET_ARRAY -join ', ')" -ForegroundColor Gray
    
    Write-Host "[2/10] Creating Security Groups..." -ForegroundColor Yellow
    
    # Check if security group exists
    $SG_ECS = (aws ec2 describe-security-groups --filters "Name=group-name,Values=${ProjectName}-ecs-sg" "Name=vpc-id,Values=$VPC_ID" --query 'SecurityGroups[0].GroupId' --output text --region $Region 2>$null)
    
    if (-not $SG_ECS -or $SG_ECS -eq "None") {
        $SG_ECS = (aws ec2 create-security-group --group-name "${ProjectName}-ecs-sg" --description "Security group for ECS tasks" --vpc-id $VPC_ID --query 'GroupId' --output text --region $Region)
        
        aws ec2 authorize-security-group-ingress --group-id $SG_ECS --protocol tcp --port 80 --cidr 0.0.0.0/0 --region $Region 2>$null
        aws ec2 authorize-security-group-ingress --group-id $SG_ECS --protocol tcp --port 443 --cidr 0.0.0.0/0 --region $Region 2>$null
        aws ec2 authorize-security-group-ingress --group-id $SG_ECS --protocol tcp --port 8000 --cidr 0.0.0.0/0 --region $Region 2>$null
        aws ec2 authorize-security-group-ingress --group-id $SG_ECS --protocol tcp --port 3000 --cidr 0.0.0.0/0 --region $Region 2>$null
    }
    
    Write-Host "  ECS Security Group: $SG_ECS" -ForegroundColor Gray
    
    # Redis security group
    $SG_REDIS = (aws ec2 describe-security-groups --filters "Name=group-name,Values=${ProjectName}-redis-sg" "Name=vpc-id,Values=$VPC_ID" --query 'SecurityGroups[0].GroupId' --output text --region $Region 2>$null)
    
    if (-not $SG_REDIS -or $SG_REDIS -eq "None") {
        $SG_REDIS = (aws ec2 create-security-group --group-name "${ProjectName}-redis-sg" --description "Security group for Redis" --vpc-id $VPC_ID --query 'GroupId' --output text --region $Region)
        aws ec2 authorize-security-group-ingress --group-id $SG_REDIS --protocol tcp --port 6379 --source-group $SG_ECS --region $Region 2>$null
    }
    
    Write-Host "  Redis Security Group: $SG_REDIS" -ForegroundColor Gray
    
    Write-Host "[3/10] Creating ElastiCache Redis..." -ForegroundColor Yellow
    Write-Host "  ⚠️  This will take 5-10 minutes..." -ForegroundColor Yellow
    
    # Check if subnet group exists
    $SUBNET_GROUP_EXISTS = (aws elasticache describe-cache-subnet-groups --cache-subnet-group-name "${ProjectName}-redis-subnet" --region $Region 2>$null)
    
    if (-not $SUBNET_GROUP_EXISTS) {
        aws elasticache create-cache-subnet-group --cache-subnet-group-name "${ProjectName}-redis-subnet" --cache-subnet-group-description "Subnet group for Redis" --subnet-ids $SUBNET_ARRAY[0] $SUBNET_ARRAY[1] --region $Region
    }
    
    # Check if Redis cluster exists
    $REDIS_EXISTS = (aws elasticache describe-cache-clusters --cache-cluster-id "${ProjectName}-redis" --region $Region 2>$null)
    
    if (-not $REDIS_EXISTS) {
        aws elasticache create-cache-cluster --cache-cluster-id "${ProjectName}-redis" --cache-node-type cache.t3.micro --engine redis --engine-version 7.0 --num-cache-nodes 1 --cache-subnet-group-name "${ProjectName}-redis-subnet" --security-group-ids $SG_REDIS --region $Region
        
        Write-Host "  Waiting for Redis to be available..." -ForegroundColor Yellow
        aws elasticache wait cache-cluster-available --cache-cluster-id "${ProjectName}-redis" --region $Region
    }
    
    Write-Host "  ✓ Redis cluster ready" -ForegroundColor Green
    
    Write-Host "[4/10] Creating ECS Cluster..." -ForegroundColor Yellow
    
    $CLUSTER_EXISTS = (aws ecs describe-clusters --clusters "${ProjectName}-cluster" --region $Region --query 'clusters[0].status' --output text 2>$null)
    
    if ($CLUSTER_EXISTS -ne "ACTIVE") {
        aws ecs create-cluster --cluster-name "${ProjectName}-cluster" --region $Region
    }
    
    Write-Host "  ✓ ECS Cluster ready" -ForegroundColor Green
    
} else {
    Write-Host "[1-4] Skipping infrastructure setup..." -ForegroundColor Gray
    
    # Get existing resources
    $VPC_ID = (aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query 'Vpcs[0].VpcId' --output text --region $Region)
    $SUBNETS = (aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query 'Subnets[*].SubnetId' --output text --region $Region)
    $SUBNET_ARRAY = $SUBNETS -split '\s+'
    $SG_ECS = (aws ec2 describe-security-groups --filters "Name=group-name,Values=${ProjectName}-ecs-sg" --query 'SecurityGroups[0].GroupId' --output text --region $Region)
}

# Get Redis endpoint
Write-Host "[5/10] Getting Redis endpoint..." -ForegroundColor Yellow
$REDIS_ENDPOINT = (aws elasticache describe-cache-clusters --cache-cluster-id "${ProjectName}-redis" --show-cache-node-info --query 'CacheClusters[0].CacheNodes[0].Endpoint.Address' --output text --region $Region)
$REDIS_PORT = (aws elasticache describe-cache-clusters --cache-cluster-id "${ProjectName}-redis" --show-cache-node-info --query 'CacheClusters[0].CacheNodes[0].Endpoint.Port' --output text --region $Region)
Write-Host "  Redis: ${REDIS_ENDPOINT}:${REDIS_PORT}" -ForegroundColor Gray

# Create/Update Secrets
Write-Host "[6/10] Updating secrets..." -ForegroundColor Yellow
.\setup-secrets-aws.ps1 -ProjectName $ProjectName -Region $Region -RedisEndpoint "${REDIS_ENDPOINT}:${REDIS_PORT}"

# Create ECR repositories
Write-Host "[7/10] Setting up ECR repositories..." -ForegroundColor Yellow

$BACKEND_REPO_EXISTS = (aws ecr describe-repositories --repository-names "${ProjectName}/backend" --region $Region 2>$null)
if (-not $BACKEND_REPO_EXISTS) {
    aws ecr create-repository --repository-name "${ProjectName}/backend" --region $Region
}

$FRONTEND_REPO_EXISTS = (aws ecr describe-repositories --repository-names "${ProjectName}/frontend" --region $Region 2>$null)
if (-not $FRONTEND_REPO_EXISTS) {
    aws ecr create-repository --repository-name "${ProjectName}/frontend" --region $Region
}

# ECR login
aws ecr get-login-password --region $Region | docker login --username AWS --password-stdin "${AWS_ACCOUNT_ID}.dkr.ecr.${Region}.amazonaws.com"

Write-Host "  ✓ ECR repositories ready" -ForegroundColor Green

# Build and push images
if (-not $SkipBuild) {
    Write-Host "[8/10] Building and pushing Docker images..." -ForegroundColor Yellow
    
    Write-Host "  → Building backend..." -ForegroundColor Cyan
    docker build -t "${ECR_BACKEND}:latest" .
    docker push "${ECR_BACKEND}:latest"
    Write-Host "  ✓ Backend image pushed" -ForegroundColor Green
    
    Write-Host "  → Building frontend (initial)..." -ForegroundColor Cyan
    Push-Location frontend
    docker build --build-arg NEXT_PUBLIC_API_URL=http://localhost:8000 -t "${ECR_FRONTEND}:latest" .
    docker push "${ECR_FRONTEND}:latest"
    Pop-Location
    Write-Host "  ✓ Frontend image pushed" -ForegroundColor Green
} else {
    Write-Host "[8/10] Skipping Docker build..." -ForegroundColor Gray
}

# Deploy Backend to ECS
Write-Host "[9/10] Deploying Backend to ECS..." -ForegroundColor Yellow

# Create IAM roles if not exist
.\setup-iam-roles.ps1 -ProjectName $ProjectName -Region $Region

# Register task definition
$taskDefJson = @"
{
  "family": "${ProjectName}-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::${AWS_ACCOUNT_ID}:role/${ProjectName}-ecs-execution-role",
  "taskRoleArn": "arn:aws:iam::${AWS_ACCOUNT_ID}:role/${ProjectName}-ecs-task-role",
  "containerDefinitions": [{
    "name": "backend",
    "image": "${ECR_BACKEND}:latest",
    "portMappings": [{"containerPort": 8000, "protocol": "tcp"}],
    "secrets": [{
      "name": "APP_SECRETS",
      "valueFrom": "arn:aws:secretsmanager:${Region}:${AWS_ACCOUNT_ID}:secret:${ProjectName}/app-secrets"
    }],
    "environment": [
      {"name": "REDIS_URL", "value": "redis://${REDIS_ENDPOINT}:${REDIS_PORT}"},
      {"name": "LOG_LEVEL", "value": "INFO"}
    ],
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-create-group": "true",
        "awslogs-group": "/ecs/${ProjectName}/backend",
        "awslogs-region": "${Region}",
        "awslogs-stream-prefix": "ecs"
      }
    }
  }]
}
"@

$taskDefJson | Out-File -FilePath "backend-task-def.json" -Encoding utf8
aws ecs register-task-definition --cli-input-json file://backend-task-def.json --region $Region

# Create/Update service
$SERVICE_EXISTS = (aws ecs describe-services --cluster "${ProjectName}-cluster" --services "${ProjectName}-backend" --region $Region --query 'services[0].status' --output text 2>$null)

if ($SERVICE_EXISTS -eq "ACTIVE") {
    aws ecs update-service --cluster "${ProjectName}-cluster" --service "${ProjectName}-backend" --task-definition "${ProjectName}-backend" --force-new-deployment --region $Region
} else {
    # Need to create ALB first (simplified - using direct IP access)
    $SUBNET_STRING = $SUBNET_ARRAY -join ','
    aws ecs create-service --cluster "${ProjectName}-cluster" --service-name "${ProjectName}-backend" --task-definition "${ProjectName}-backend" --desired-count 1 --launch-type FARGATE --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_STRING],securityGroups=[$SG_ECS],assignPublicIp=ENABLED}" --region $Region
}

Write-Host "  ✓ Backend service deployed" -ForegroundColor Green

# Get backend public IP (for simple setup without ALB)
Write-Host "  Getting backend endpoint..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

$TASK_ARN = (aws ecs list-tasks --cluster "${ProjectName}-cluster" --service-name "${ProjectName}-backend" --region $Region --query 'taskArns[0]' --output text)
$ENI_ID = (aws ecs describe-tasks --cluster "${ProjectName}-cluster" --tasks $TASK_ARN --region $Region --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' --output text)
$BACKEND_IP = (aws ec2 describe-network-interfaces --network-interface-ids $ENI_ID --region $Region --query 'NetworkInterfaces[0].Association.PublicIp' --output text)

Write-Host "  Backend IP: $BACKEND_IP" -ForegroundColor Cyan

# Deploy Frontend
Write-Host "[10/10] Deploying Frontend..." -ForegroundColor Yellow

Write-Host "  Rebuilding frontend with backend URL..." -ForegroundColor Cyan
Push-Location frontend
docker build --build-arg NEXT_PUBLIC_API_URL="http://${BACKEND_IP}:8000" -t "${ECR_FRONTEND}:latest" .
docker push "${ECR_FRONTEND}:latest"
Pop-Location

# Frontend task definition
$frontendTaskDefJson = @"
{
  "family": "${ProjectName}-frontend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::${AWS_ACCOUNT_ID}:role/${ProjectName}-ecs-execution-role",
  "containerDefinitions": [{
    "name": "frontend",
    "image": "${ECR_FRONTEND}:latest",
    "portMappings": [{"containerPort": 3000, "protocol": "tcp"}],
    "environment": [
      {"name": "NEXT_PUBLIC_API_URL", "value": "http://${BACKEND_IP}:8000"}
    ],
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-create-group": "true",
        "awslogs-group": "/ecs/${ProjectName}/frontend",
        "awslogs-region": "${Region}",
        "awslogs-stream-prefix": "ecs"
      }
    }
  }]
}
"@

$frontendTaskDefJson | Out-File -FilePath "frontend-task-def.json" -Encoding utf8
aws ecs register-task-definition --cli-input-json file://frontend-task-def.json --region $Region

# Create/Update frontend service
$FRONTEND_SERVICE_EXISTS = (aws ecs describe-services --cluster "${ProjectName}-cluster" --services "${ProjectName}-frontend" --region $Region --query 'services[0].status' --output text 2>$null)

if ($FRONTEND_SERVICE_EXISTS -eq "ACTIVE") {
    aws ecs update-service --cluster "${ProjectName}-cluster" --service "${ProjectName}-frontend" --task-definition "${ProjectName}-frontend" --force-new-deployment --region $Region
} else {
    aws ecs create-service --cluster "${ProjectName}-cluster" --service-name "${ProjectName}-frontend" --task-definition "${ProjectName}-frontend" --desired-count 1 --launch-type FARGATE --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_STRING],securityGroups=[$SG_ECS],assignPublicIp=ENABLED}" --region $Region
}

Write-Host "  ✓ Frontend service deployed" -ForegroundColor Green

# Get frontend IP
Start-Sleep -Seconds 10
$FRONTEND_TASK_ARN = (aws ecs list-tasks --cluster "${ProjectName}-cluster" --service-name "${ProjectName}-frontend" --region $Region --query 'taskArns[0]' --output text)
$FRONTEND_ENI_ID = (aws ecs describe-tasks --cluster "${ProjectName}-cluster" --tasks $FRONTEND_TASK_ARN --region $Region --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' --output text)
$FRONTEND_IP = (aws ec2 describe-network-interfaces --network-interface-ids $FRONTEND_ENI_ID --region $Region --query 'NetworkInterfaces[0].Association.PublicIp' --output text)

# Cleanup temp files
Remove-Item backend-task-def.json -ErrorAction SilentlyContinue
Remove-Item frontend-task-def.json -ErrorAction SilentlyContinue

# Summary
Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Deployment Complete! 🎉" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Services:" -ForegroundColor Yellow
Write-Host "  Backend:  http://${BACKEND_IP}:8000" -ForegroundColor White
Write-Host "  Frontend: http://${FRONTEND_IP}:3000" -ForegroundColor White
Write-Host ""
Write-Host "Test backend:" -ForegroundColor Yellow
Write-Host "  Invoke-WebRequest -Uri http://${BACKEND_IP}:8000/api/health" -ForegroundColor White
Write-Host ""
Write-Host "View logs:" -ForegroundColor Yellow
Write-Host "  aws logs tail /ecs/${ProjectName}/backend --follow --region ${Region}" -ForegroundColor White
Write-Host ""
Write-Host "Note: For production, consider setting up Application Load Balancer for better reliability and custom domain." -ForegroundColor Yellow
Write-Host ""
