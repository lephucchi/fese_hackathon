# Setup IAM Roles for ECS
# Creates execution role and task role

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectName,
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "ap-southeast-1"
)

$ErrorActionPreference = "Stop"

Write-Host "Setting up IAM roles for ECS..." -ForegroundColor Cyan

$AWS_ACCOUNT_ID = (aws sts get-caller-identity --query Account --output text)

# Create ECS Task Execution Role
Write-Host "Creating ECS Task Execution Role..." -ForegroundColor Yellow

$EXECUTION_ROLE_EXISTS = (aws iam get-role --role-name "${ProjectName}-ecs-execution-role" 2>$null)

if (-not $EXECUTION_ROLE_EXISTS) {
    $assumeRolePolicy = @"
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
    "Action": "sts:AssumeRole"
  }]
}
"@
    
    aws iam create-role --role-name "${ProjectName}-ecs-execution-role" --assume-role-policy-document $assumeRolePolicy
    
    # Attach policies
    aws iam attach-role-policy --role-name "${ProjectName}-ecs-execution-role" --policy-arn "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
    aws iam attach-role-policy --role-name "${ProjectName}-ecs-execution-role" --policy-arn "arn:aws:iam::aws:policy/SecretsManagerReadWrite"
    
    Write-Host "✓ ECS Task Execution Role created" -ForegroundColor Green
} else {
    Write-Host "✓ ECS Task Execution Role already exists" -ForegroundColor Gray
}

# Create ECS Task Role
Write-Host "Creating ECS Task Role..." -ForegroundColor Yellow

$TASK_ROLE_EXISTS = (aws iam get-role --role-name "${ProjectName}-ecs-task-role" 2>$null)

if (-not $TASK_ROLE_EXISTS) {
    $assumeRolePolicy = @"
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
    "Action": "sts:AssumeRole"
  }]
}
"@
    
    aws iam create-role --role-name "${ProjectName}-ecs-task-role" --assume-role-policy-document $assumeRolePolicy
    
    # Create custom policy for task role
    $taskPolicy = @"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    }
  ]
}
"@
    
    aws iam put-role-policy --role-name "${ProjectName}-ecs-task-role" --policy-name "${ProjectName}-task-policy" --policy-document $taskPolicy
    
    Write-Host "✓ ECS Task Role created" -ForegroundColor Green
} else {
    Write-Host "✓ ECS Task Role already exists" -ForegroundColor Gray
}

Write-Host ""
Write-Host "IAM Roles created:" -ForegroundColor Cyan
Write-Host "  Execution Role: ${ProjectName}-ecs-execution-role" -ForegroundColor White
Write-Host "  Task Role: ${ProjectName}-ecs-task-role" -ForegroundColor White
Write-Host ""
