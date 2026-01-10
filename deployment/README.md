# AWS vs GCP Deployment Comparison

## Deployment Options

### GCP (Google Cloud Platform)
**Location**: `deployment/` folder (root level)
- ✅ Đơn giản hơn, ít bước hơn
- ✅ Cloud Run auto-scale tốt hơn (scale to 0)
- ✅ Setup nhanh hơn (~10-15 phút)
- ❌ VPC Connector đôi khi gặp lỗi tạo
- ❌ Ít flexible hơn

**Files**:
- `DEPLOY_GCP_CLOUD_RUN.md` - Hướng dẫn chi tiết
- `QUICK_START_DEPLOY.md` - Quick start
- `deploy-gcp.ps1` - Script deploy tự động
- `setup-secrets.ps1` - Setup secrets
- `setup-scheduler.ps1` - Setup Cloud Scheduler

### AWS (Amazon Web Services)
**Location**: `deployment/aws/` folder
- ✅ Nhiều options hơn, flexible hơn
- ✅ Reliable hơn, ít lỗi infrastructure
- ✅ Phù hợp cho production lớn
- ❌ Phức tạp hơn, nhiều bước hơn
- ❌ Setup lâu hơn (~15-20 phút)

**Files**:
- `DEPLOY_AWS_ECS.md` - Hướng dẫn chi tiết
- `QUICK_START_AWS.md` - Quick start
- `deploy-aws.ps1` - Script deploy tự động
- `setup-secrets-aws.ps1` - Setup AWS Secrets Manager
- `setup-iam-roles.ps1` - Setup IAM roles
- `cleanup-aws.ps1` - Cleanup resources

## Kiến trúc so sánh

| Component | GCP | AWS |
|-----------|-----|-----|
| Container Runtime | Cloud Run | ECS Fargate |
| Redis Cache | Cloud Memorystore | ElastiCache |
| Container Registry | Artifact Registry | ECR |
| Secrets | Secret Manager | Secrets Manager |
| Scheduler | Cloud Scheduler | EventBridge |
| Networking | VPC Connector | VPC + Security Groups |
| Load Balancer | Tự động | Application Load Balancer |

## Chi phí so sánh (hàng tháng)

### GCP Cloud Run
```
Backend (Cloud Run):         $15-30
Frontend (Cloud Run):        $5-15
NewsAnalyst (Scheduled):     $5-10
Redis (Memorystore 1GB):     $30
VPC Connector:               $8
Artifact Registry:           $0.10/GB
─────────────────────────────────
TOTAL:                       $65-100/tháng
```

### AWS ECS Fargate
```
Backend (Fargate):           $30-40
Frontend (Fargate):          $15-25
NewsAnalyst (Scheduled):     $5-10
Redis (ElastiCache t3.micro): $13
Application Load Balancer:   $16
ECR Storage:                 $1
Data Transfer:               $10-20
─────────────────────────────────
TOTAL:                       $90-125/tháng
```

**Winner**: GCP rẻ hơn khoảng 20-25%

## Performance

Cả hai đều tốt, không có sự khác biệt đáng kể cho use case này.

## Ease of Use

**GCP**: Đơn giản hơn, ít concepts hơn
**AWS**: Nhiều options hơn, phức tạp hơn

**Winner**: GCP cho beginners, AWS cho advanced users

## Khuyến nghị

### Chọn GCP nếu:
- ✅ Bạn mới bắt đầu với cloud
- ✅ Muốn setup nhanh
- ✅ Ưu tiên đơn giản
- ✅ Budget nhỏ
- ✅ Không cần quá nhiều customization

### Chọn AWS nếu:
- ✅ Đã quen với AWS ecosystem
- ✅ Cần nhiều options và flexibility
- ✅ Dự án production lớn
- ✅ Cần integrate với AWS services khác
- ✅ Cần reliability cao nhất

## Quick Start Commands

### GCP
```powershell
cd deployment
.\setup-secrets.ps1 -ProjectId "YOUR_PROJECT_ID"
.\deploy-gcp.ps1 -ProjectId "YOUR_PROJECT_ID"
```

### AWS
```powershell
cd deployment\aws
.\setup-secrets-aws.ps1 -ProjectName "rag-finance"
.\deploy-aws.ps1 -ProjectName "rag-finance"
```

## Alternative: Upstash Redis (Serverless)

Cả GCP và AWS đều có thể dùng **Upstash Redis** để:
- ❌ Không cần VPC Connector (GCP)
- ❌ Không cần ElastiCache + VPC setup (AWS)
- ✅ Serverless, pay-as-you-go
- ✅ Free tier có sẵn
- ✅ Connect qua internet (HTTPS)
- ✅ Đơn giản nhất

**Setup Upstash**:
1. Đăng ký: https://upstash.com
2. Tạo Redis database
3. Lấy Redis URL
4. Dùng URL đó trong ENV vars
5. Không cần VPC Connector hoặc ElastiCache!

## Monitoring & Logs

### GCP
```powershell
# View logs
gcloud run logs tail rag-backend --region asia-southeast1

# View metrics
gcloud monitoring dashboards list
```

### AWS
```powershell
# View logs
aws logs tail /ecs/rag-finance/backend --follow --region ap-southeast-1

# CloudWatch metrics
aws cloudwatch get-metric-statistics ...
```

## Rollback

### GCP
```powershell
gcloud run services update-traffic rag-backend --to-revisions REVISION=100 --region asia-southeast1
```

### AWS
```powershell
aws ecs update-service --cluster rag-finance-cluster --service rag-finance-backend --task-definition rag-finance-backend:PREVIOUS
```

## Cleanup

### GCP
```powershell
# Manual cleanup - delete services one by one
gcloud run services delete rag-backend --region asia-southeast1
gcloud redis instances delete rag-redis --region asia-southeast1
...
```

### AWS
```powershell
# Automated cleanup script
.\cleanup-aws.ps1 -ProjectName "rag-finance"
```

## Conclusion

**Để test/demo nhanh**: Dùng GCP Cloud Run  
**Để production nghiêm túc**: Cả hai đều OK, nhưng AWS có edge về reliability  
**Để tiết kiệm chi phí**: GCP rẻ hơn  
**Để đơn giản nhất**: Dùng Upstash Redis + Cloud Run (GCP) hoặc App Runner (AWS)
