# Quick Start: Deploy lên AWS ECS Fargate

## Bước 1: Cài đặt AWS CLI
```powershell
# Download và cài đặt
# https://awscli.amazonaws.com/AWSCLIV2.msi

# Hoặc dùng winget
winget install Amazon.AWSCLI

# Verify
aws --version
```

## Bước 2: Configure AWS
```powershell
# Login AWS
aws configure

# Nhập:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region: ap-southeast-1  (Singapore)
# - Output format: json

# Test
aws sts get-caller-identity
```

## Bước 3: Setup Secrets
```powershell
# Đảm bảo file .env có đầy đủ thông tin
# Chạy script setup
cd deployment\aws
.\setup-secrets-aws.ps1 -ProjectName "rag-finance" -Region "ap-southeast-1"
```

## Bước 4: Deploy
```powershell
# Deploy toàn bộ (lần đầu - khoảng 15-20 phút)
.\deploy-aws.ps1 -ProjectName "rag-finance" -Region "ap-southeast-1"

# Các lần sau (chỉ update code)
.\deploy-aws.ps1 -ProjectName "rag-finance" -SkipInfrastructure
```

## Xong! 🎉

Services sẽ được deploy với public IPs:
- Backend: `http://x.x.x.x:8000`
- Frontend: `http://y.y.y.y:3000`

## Chi phí ước tính

### Development/Testing
- ~$3-5/ngày (với min-instances = 0)

### Production (24/7)
- **ECS Fargate**: ~$30-40/tháng (backend)
- **ECS Fargate**: ~$15-25/tháng (frontend)
- **ElastiCache t3.micro**: ~$13/tháng
- **Data Transfer**: ~$10-20/tháng
- **Total**: ~$70-100/tháng

## So sánh AWS vs GCP

| Feature | AWS | GCP | Winner |
|---------|-----|-----|--------|
| Dễ setup | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | GCP |
| Chi phí | $70-100 | $65-100 | Draw |
| Performance | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Draw |
| Scaling | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | GCP |
| Reliability | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | AWS |

## Troubleshooting

### Lỗi "No default VPC"
```powershell
# Tạo VPC mới
aws ec2 create-default-vpc
```

### Lỗi IAM permissions
```powershell
# Cần các permissions:
# - ECS Full Access
# - ECR Full Access
# - ElastiCache Full Access
# - EC2 Full Access
# - IAM Full Access
# - Secrets Manager Full Access
```

### Redis connection timeout
- Kiểm tra Security Group đã mở port 6379
- Verify Redis endpoint đúng
- Ensure ECS tasks ở cùng VPC với Redis

### ECS tasks không start
```powershell
# Check logs
aws logs tail /ecs/rag-finance/backend --follow --region ap-southeast-1

# Check task definition
aws ecs describe-task-definition --task-definition rag-finance-backend --region ap-southeast-1
```

## Production Setup

Để production, nên thêm:

1. **Application Load Balancer**
   - Custom domain
   - HTTPS/SSL
   - Auto scaling
   
2. **Auto Scaling**
   - Scale based on CPU/Memory
   - Min/Max instances
   
3. **CloudWatch Alarms**
   - Error rate monitoring
   - Resource monitoring
   
4. **CI/CD**
   - GitHub Actions
   - Auto deploy on push

5. **Monitoring**
   - CloudWatch dashboards
   - X-Ray tracing

## Cleanup (xóa toàn bộ)
```powershell
.\cleanup-aws.ps1 -ProjectName "rag-finance" -Region "ap-southeast-1"
```

## Tips tiết kiệm chi phí

1. **Dùng Fargate Spot** (70% rẻ hơn)
2. **Set desired count = 0** khi không dùng
3. **Dùng smaller instance types** cho dev/test
4. **Enable auto-scaling** chỉ khi cần
5. **Dùng Upstash Redis** thay ElastiCache (serverless)

## Alternative: Dùng AWS App Runner

Nếu muốn đơn giản hơn (giống Cloud Run):
```powershell
# Deploy backend
aws apprunner create-service --service-name rag-backend --source-configuration ...

# Deploy frontend  
aws apprunner create-service --service-name rag-frontend --source-configuration ...
```

**Ưu điểm App Runner:**
- ✅ Đơn giản hơn ECS
- ✅ Auto scaling built-in
- ✅ Tự động HTTPS

**Nhược điểm:**
- ❌ Đắt hơn ~20-30%
- ❌ Ít options hơn
- ❌ Không connect VPC dễ dàng (cần VPC Connector - tương tự GCP)
