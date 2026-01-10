# Cleanup AWS Resources
# Removes all resources created for the project

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectName,
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "ap-southeast-1",
    
    [Parameter(Mandatory=$false)]
    [switch]$Force
)

$ErrorActionPreference = "Stop"

if (-not $Force) {
    Write-Host "⚠️  WARNING: This will delete ALL AWS resources for ${ProjectName}" -ForegroundColor Red
    Write-Host ""
    $confirm = Read-Host "Are you sure? Type 'yes' to confirm"
    
    if ($confirm -ne "yes") {
        Write-Host "Cleanup cancelled." -ForegroundColor Yellow
        exit 0
    }
}

Write-Host "Starting cleanup..." -ForegroundColor Cyan
Write-Host ""

# Delete ECS Services
Write-Host "[1/10] Deleting ECS services..." -ForegroundColor Yellow
try {
    aws ecs update-service --cluster "${ProjectName}-cluster" --service "${ProjectName}-backend" --desired-count 0 --region $Region 2>$null
    aws ecs delete-service --cluster "${ProjectName}-cluster" --service "${ProjectName}-backend" --force --region $Region 2>$null
    Write-Host "  ✓ Backend service deleted" -ForegroundColor Gray
} catch {
    Write-Host "  ⊘ Backend service not found" -ForegroundColor Gray
}

try {
    aws ecs update-service --cluster "${ProjectName}-cluster" --service "${ProjectName}-frontend" --desired-count 0 --region $Region 2>$null
    aws ecs delete-service --cluster "${ProjectName}-cluster" --service "${ProjectName}-frontend" --force --region $Region 2>$null
    Write-Host "  ✓ Frontend service deleted" -ForegroundColor Gray
} catch {
    Write-Host "  ⊘ Frontend service not found" -ForegroundColor Gray
}

# Wait for services to be deleted
Start-Sleep -Seconds 10

# Delete ECS Cluster
Write-Host "[2/10] Deleting ECS cluster..." -ForegroundColor Yellow
try {
    aws ecs delete-cluster --cluster "${ProjectName}-cluster" --region $Region 2>$null
    Write-Host "  ✓ ECS cluster deleted" -ForegroundColor Gray
} catch {
    Write-Host "  ⊘ ECS cluster not found" -ForegroundColor Gray
}

# Delete Task Definitions (deregister)
Write-Host "[3/10] Deregistering task definitions..." -ForegroundColor Yellow
$taskDefs = aws ecs list-task-definitions --family-prefix "${ProjectName}" --region $Region --query 'taskDefinitionArns[]' --output text 2>$null
if ($taskDefs) {
    $taskDefs -split '\s+' | ForEach-Object {
        aws ecs deregister-task-definition --task-definition $_ --region $Region 2>$null
    }
    Write-Host "  ✓ Task definitions deregistered" -ForegroundColor Gray
}

# Delete CloudWatch Log Groups
Write-Host "[4/10] Deleting CloudWatch log groups..." -ForegroundColor Yellow
try {
    aws logs delete-log-group --log-group-name "/ecs/${ProjectName}/backend" --region $Region 2>$null
    aws logs delete-log-group --log-group-name "/ecs/${ProjectName}/frontend" --region $Region 2>$null
    Write-Host "  ✓ Log groups deleted" -ForegroundColor Gray
} catch {
    Write-Host "  ⊘ Log groups not found" -ForegroundColor Gray
}

# Delete ElastiCache
Write-Host "[5/10] Deleting ElastiCache Redis..." -ForegroundColor Yellow
Write-Host "  ⚠️  This may take a few minutes..." -ForegroundColor Yellow
try {
    aws elasticache delete-cache-cluster --cache-cluster-id "${ProjectName}-redis" --region $Region 2>$null
    Write-Host "  Waiting for deletion..." -ForegroundColor Gray
    Start-Sleep -Seconds 30
    Write-Host "  ✓ Redis cluster deletion initiated" -ForegroundColor Gray
} catch {
    Write-Host "  ⊘ Redis cluster not found" -ForegroundColor Gray
}

# Delete Cache Subnet Group
Write-Host "[6/10] Deleting cache subnet group..." -ForegroundColor Yellow
try {
    aws elasticache delete-cache-subnet-group --cache-subnet-group-name "${ProjectName}-redis-subnet" --region $Region 2>$null
    Write-Host "  ✓ Cache subnet group deleted" -ForegroundColor Gray
} catch {
    Write-Host "  ⊘ Cache subnet group not found" -ForegroundColor Gray
}

# Delete ECR Repositories
Write-Host "[7/10] Deleting ECR repositories..." -ForegroundColor Yellow
try {
    aws ecr delete-repository --repository-name "${ProjectName}/backend" --force --region $Region 2>$null
    aws ecr delete-repository --repository-name "${ProjectName}/frontend" --force --region $Region 2>$null
    Write-Host "  ✓ ECR repositories deleted" -ForegroundColor Gray
} catch {
    Write-Host "  ⊘ ECR repositories not found" -ForegroundColor Gray
}

# Delete Secrets
Write-Host "[8/10] Deleting secrets..." -ForegroundColor Yellow
try {
    aws secretsmanager delete-secret --secret-id "${ProjectName}/app-secrets" --force-delete-without-recovery --region $Region 2>$null
    Write-Host "  ✓ Secrets deleted" -ForegroundColor Gray
} catch {
    Write-Host "  ⊘ Secrets not found" -ForegroundColor Gray
}

# Delete Security Groups
Write-Host "[9/10] Deleting security groups..." -ForegroundColor Yellow
Start-Sleep -Seconds 5  # Wait for resources to release SGs

$VPC_ID = (aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query 'Vpcs[0].VpcId' --output text --region $Region)

try {
    $SG_REDIS = (aws ec2 describe-security-groups --filters "Name=group-name,Values=${ProjectName}-redis-sg" "Name=vpc-id,Values=$VPC_ID" --query 'SecurityGroups[0].GroupId' --output text --region $Region 2>$null)
    if ($SG_REDIS -and $SG_REDIS -ne "None") {
        aws ec2 delete-security-group --group-id $SG_REDIS --region $Region 2>$null
        Write-Host "  ✓ Redis security group deleted" -ForegroundColor Gray
    }
} catch {
    Write-Host "  ⊘ Redis security group not found or in use" -ForegroundColor Gray
}

try {
    $SG_ECS = (aws ec2 describe-security-groups --filters "Name=group-name,Values=${ProjectName}-ecs-sg" "Name=vpc-id,Values=$VPC_ID" --query 'SecurityGroups[0].GroupId' --output text --region $Region 2>$null)
    if ($SG_ECS -and $SG_ECS -ne "None") {
        aws ec2 delete-security-group --group-id $SG_ECS --region $Region 2>$null
        Write-Host "  ✓ ECS security group deleted" -ForegroundColor Gray
    }
} catch {
    Write-Host "  ⊘ ECS security group not found or in use" -ForegroundColor Gray
}

# Delete IAM Roles
Write-Host "[10/10] Deleting IAM roles..." -ForegroundColor Yellow
try {
    # Detach policies first
    aws iam detach-role-policy --role-name "${ProjectName}-ecs-execution-role" --policy-arn "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy" 2>$null
    aws iam detach-role-policy --role-name "${ProjectName}-ecs-execution-role" --policy-arn "arn:aws:iam::aws:policy/SecretsManagerReadWrite" 2>$null
    aws iam delete-role --role-name "${ProjectName}-ecs-execution-role" 2>$null
    Write-Host "  ✓ ECS execution role deleted" -ForegroundColor Gray
} catch {
    Write-Host "  ⊘ ECS execution role not found" -ForegroundColor Gray
}

try {
    # Delete inline policies first
    aws iam delete-role-policy --role-name "${ProjectName}-ecs-task-role" --policy-name "${ProjectName}-task-policy" 2>$null
    aws iam delete-role --role-name "${ProjectName}-ecs-task-role" 2>$null
    Write-Host "  ✓ ECS task role deleted" -ForegroundColor Gray
} catch {
    Write-Host "  ⊘ ECS task role not found" -ForegroundColor Gray
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Cleanup Complete! 🧹" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "All resources for ${ProjectName} have been deleted." -ForegroundColor White
Write-Host ""
Write-Host "Note: Some resources like VPC and subnets were not deleted if they were default or shared." -ForegroundColor Yellow
Write-Host ""
