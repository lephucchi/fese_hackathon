# Deploy dự án lên Google Cloud Run

## Tổng quan
Dự án này có 4 services:
- **Backend API**: FastAPI + RAG Pipeline
- **NewsAnalyst Worker**: Scheduled worker cho news scraping
- **Frontend**: Next.js application
- **Redis**: Cache (sẽ chuyển sang Cloud Memorystore)

## Bước 1: Chuẩn bị môi trường GCP

### 1.1. Cài đặt Google Cloud SDK
```bash
# Download và cài đặt từ: https://cloud.google.com/sdk/docs/install
# Hoặc trên Windows dùng:
(New-Object Net.WebClient).DownloadFile("https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe", "$env:Temp\GoogleCloudSDKInstaller.exe")
& $env:Temp\GoogleCloudSDKInstaller.exe
```

### 1.2. Đăng nhập và khởi tạo
```bash
# Đăng nhập
gcloud auth login

# Set project (thay YOUR_PROJECT_ID)
gcloud config set project YOUR_PROJECT_ID

# Enable các APIs cần thiết
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable redis.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable cloudscheduler.googleapis.com
```

## Bước 2: Tạo Artifact Registry

```bash
# Tạo repository để lưu Docker images
gcloud artifacts repositories create rag-finance-repo \
  --repository-format=docker \
  --location=asia-southeast1 \
  --description="RAG Finance Application Images"

# Configure Docker authentication
gcloud auth configure-docker asia-southeast1-docker.pkg.dev
```

## Bước 3: Tạo Redis trên Cloud Memorystore

```bash
# Tạo Redis instance (tier basic - giá rẻ hơn)
gcloud redis instances create rag-redis \
  --size=1 \
  --region=asia-southeast1 \
  --redis-version=redis_7_0 \
  --tier=basic

# Lấy Redis connection info (sẽ dùng sau)
gcloud redis instances describe rag-redis --region=asia-southeast1
```

**Lưu ý**: Cloud Memorystore Redis chỉ accessible từ VPC. Bạn cần tạo VPC connector.

## Bước 4: Tạo VPC Serverless Connector

```bash
# Tạo VPC connector để Cloud Run kết nối Redis
gcloud compute networks vpc-access connectors create rag-connector \
  --network=default \
  --region=asia-southeast1 \
  --range=10.8.0.0/28
```

## Bước 5: Lưu trữ Secrets

```bash
# Tạo secrets cho environment variables
echo -n "YOUR_SUPABASE_URL" | gcloud secrets create SUPABASE_URL --data-file=-
echo -n "YOUR_SUPABASE_SERVICE_ROLE_KEY" | gcloud secrets create SUPABASE_SERVICE_ROLE_KEY --data-file=-
echo -n "YOUR_SUPABASE_ANON_KEY" | gcloud secrets create SUPABASE_ANON_KEY --data-file=-
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets create GEMINI_API_KEY --data-file=-
echo -n "YOUR_GOOGLE_CUSTOM_SEARCH_API_KEY" | gcloud secrets create GOOGLE_CUSTOM_SEARCH_API_KEY --data-file=-
echo -n "YOUR_GOOGLE_CUSTOM_SEARCH_ENGINE_ID" | gcloud secrets create GOOGLE_CUSTOM_SEARCH_ENGINE_ID --data-file=-
```

## Bước 6: Build và Push Docker Images

### 6.1. Backend
```bash
# Set variables
$PROJECT_ID = "YOUR_PROJECT_ID"
$REGION = "asia-southeast1"
$REPO = "rag-finance-repo"

# Build và push backend
docker build -t "${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/backend:latest" .
docker push "${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/backend:latest"
```

### 6.2. NewsAnalyst (dùng cùng image với backend)
NewsAnalyst dùng cùng image với backend, chỉ khác command.

### 6.3. Frontend
```bash
# Build và push frontend
cd frontend
docker build --build-arg NEXT_PUBLIC_API_URL=https://backend-HASH-uc.a.run.app -t "${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/frontend:latest" .
docker push "${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/frontend:latest"
cd ..
```

**Lưu ý**: Bạn sẽ cần update `NEXT_PUBLIC_API_URL` sau khi deploy backend.

## Bước 7: Deploy lên Cloud Run

### 7.1. Deploy Backend API
```bash
# Lấy Redis host (từ bước 3)
$REDIS_HOST = $(gcloud redis instances describe rag-redis --region=asia-southeast1 --format="value(host)")

# Deploy backend
gcloud run deploy rag-backend \
  --image asia-southeast1-docker.pkg.dev/$PROJECT_ID/rag-finance-repo/backend:latest \
  --region asia-southeast1 \
  --platform managed \
  --port 8000 \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --min-instances 0 \
  --max-instances 10 \
  --vpc-connector rag-connector \
  --vpc-egress all-traffic \
  --allow-unauthenticated \
  --set-env-vars REDIS_URL=redis://$REDIS_HOST:6379 \
  --set-secrets SUPABASE_URL=SUPABASE_URL:latest,SUPABASE_SERVICE_ROLE_KEY=SUPABASE_SERVICE_ROLE_KEY:latest,SUPABASE_ANON_KEY=SUPABASE_ANON_KEY:latest,GEMINI_API_KEY=GEMINI_API_KEY:latest,GOOGLE_CUSTOM_SEARCH_API_KEY=GOOGLE_CUSTOM_SEARCH_API_KEY:latest,GOOGLE_CUSTOM_SEARCH_ENGINE_ID=GOOGLE_CUSTOM_SEARCH_ENGINE_ID:latest
```

### 7.2. Deploy NewsAnalyst Worker
```bash
# Deploy newsanalyst worker
gcloud run deploy rag-newsanalyst \
  --image asia-southeast1-docker.pkg.dev/$PROJECT_ID/rag-finance-repo/backend:latest \
  --region asia-southeast1 \
  --platform managed \
  --memory 1Gi \
  --cpu 1 \
  --timeout 900 \
  --min-instances 0 \
  --max-instances 1 \
  --vpc-connector rag-connector \
  --vpc-egress all-traffic \
  --no-allow-unauthenticated \
  --args="python","-m","src.functions.NewsAnalyst.main","--mode","scheduled" \
  --set-env-vars REDIS_URL=redis://$REDIS_HOST:6379,NEWS_SCRAPE_INTERVAL_HOURS=4 \
  --set-secrets SUPABASE_URL=SUPABASE_URL:latest,SUPABASE_SERVICE_ROLE_KEY=SUPABASE_SERVICE_ROLE_KEY:latest,GEMINI_API_KEY=GEMINI_API_KEY:latest
```

### 7.3. Tạo Cloud Scheduler cho NewsAnalyst
```bash
# Get service URL
$NEWSANALYST_URL = $(gcloud run services describe rag-newsanalyst --region asia-southeast1 --format="value(status.url)")

# Create scheduler job (chạy mỗi 4 giờ)
gcloud scheduler jobs create http news-analyst-trigger \
  --location asia-southeast1 \
  --schedule "0 */4 * * *" \
  --uri "$NEWSANALYST_URL/trigger" \
  --http-method POST \
  --oidc-service-account-email YOUR_SERVICE_ACCOUNT@YOUR_PROJECT.iam.gserviceaccount.com
```

**Lưu ý**: Bạn cần tạo service account với quyền Cloud Run Invoker.

### 7.4. Deploy Frontend
```bash
# Get backend URL
$BACKEND_URL = $(gcloud run services describe rag-backend --region asia-southeast1 --format="value(status.url)")

# Rebuild frontend với backend URL đúng
cd frontend
docker build --build-arg NEXT_PUBLIC_API_URL=$BACKEND_URL -t "asia-southeast1-docker.pkg.dev/$PROJECT_ID/rag-finance-repo/frontend:latest" .
docker push "asia-southeast1-docker.pkg.dev/$PROJECT_ID/rag-finance-repo/frontend:latest"
cd ..

# Deploy frontend
gcloud run deploy rag-frontend \
  --image asia-southeast1-docker.pkg.dev/$PROJECT_ID/rag-finance-repo/frontend:latest \
  --region asia-southeast1 \
  --platform managed \
  --port 3000 \
  --memory 512Mi \
  --cpu 1 \
  --timeout 60 \
  --min-instances 0 \
  --max-instances 5 \
  --allow-unauthenticated \
  --set-env-vars NEXT_PUBLIC_API_URL=$BACKEND_URL
```

## Bước 8: Cấu hình CORS (nếu cần)

Nếu frontend và backend ở khác domain, bạn cần cấu hình CORS trong backend. Kiểm tra file `src/api/main.py`.

## Bước 9: Kiểm tra

```bash
# Get all service URLs
gcloud run services list --region asia-southeast1

# Test backend
curl https://rag-backend-HASH-uc.a.run.app/api/health

# Test frontend
curl https://rag-frontend-HASH-uc.a.run.app
```

## Chi phí ước tính (hàng tháng)

- **Cloud Run Backend**: ~$15-30 (tùy traffic)
- **Cloud Run Frontend**: ~$5-15
- **Cloud Run NewsAnalyst**: ~$5-10
- **Cloud Memorystore Redis (1GB Basic)**: ~$30
- **VPC Connector**: ~$8
- **Artifact Registry**: ~$0.10/GB
- **Cloud Scheduler**: Free (first 3 jobs)

**Tổng**: ~$65-100/tháng với traffic vừa phải

## Tối ưu hóa chi phí

1. **Dùng `--min-instances 0`**: Tắt khi không dùng
2. **Giảm memory/CPU**: Chỉ dùng đủ
3. **Enable Cloud CDN**: Cache static content
4. **Dùng Redis Tier Basic**: Rẻ hơn Standard
5. **Set up budget alerts**: Theo dõi chi phí

## Troubleshooting

### Lỗi kết nối Redis
- Kiểm tra VPC connector đã tạo đúng chưa
- Kiểm tra `--vpc-egress all-traffic`
- Verify Redis host từ `gcloud redis instances describe`

### Frontend không kết nối backend
- Kiểm tra CORS settings
- Verify `NEXT_PUBLIC_API_URL` đúng
- Check network requests trong browser DevTools

### NewsAnalyst không chạy
- Check logs: `gcloud run logs read rag-newsanalyst --region asia-southeast1`
- Verify service account permissions
- Check Cloud Scheduler job status

## Scripts tự động

Xem file `deploy-gcp.ps1` để có script tự động deploy toàn bộ.

## Rollback

```bash
# List revisions
gcloud run revisions list --service rag-backend --region asia-southeast1

# Rollback to previous revision
gcloud run services update-traffic rag-backend \
  --to-revisions REVISION_NAME=100 \
  --region asia-southeast1
```

## Monitoring

```bash
# View logs
gcloud run logs tail rag-backend --region asia-southeast1

# View metrics
gcloud monitoring dashboards list
```

## CI/CD với GitHub Actions

Xem file `.github/workflows/deploy-gcp.yml` để setup tự động deploy khi push code.
