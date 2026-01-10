# Quick Start: Deploy lên Google Cloud Run

## Bước 1: Chuẩn bị
```powershell
# 1. Cài Google Cloud SDK (nếu chưa có)
# Download từ: https://cloud.google.com/sdk/docs/install

# 2. Đăng nhập GCP
gcloud auth login

# 3. Tạo project mới hoặc dùng project có sẵn
# Đi tới: https://console.cloud.google.com/projectcreate
# Hoặc dùng project có sẵn
```

## Bước 2: Setup Secrets
```powershell
# Đảm bảo file .env có đầy đủ thông tin:
# - SUPABASE_URL
# - SUPABASE_SERVICE_ROLE_KEY
# - SUPABASE_ANON_KEY
# - GEMINI_API_KEY
# - GOOGLE_CUSTOM_SEARCH_API_KEY
# - GOOGLE_CUSTOM_SEARCH_ENGINE_ID

# Chạy script setup secrets
.\setup-secrets.ps1 -ProjectId "YOUR_PROJECT_ID"
```

## Bước 3: Deploy
```powershell
# Deploy toàn bộ (lần đầu - khoảng 15-20 phút)
.\deploy-gcp.ps1 -ProjectId "YOUR_PROJECT_ID"

# Các lần sau (chỉ build và deploy code - khoảng 5-7 phút)
.\deploy-gcp.ps1 -ProjectId "YOUR_PROJECT_ID" -SkipInfrastructure
```

## Bước 4: Setup Cloud Scheduler (Optional)
```powershell
# Để NewsAnalyst tự động chạy mỗi 4 giờ
.\setup-scheduler.ps1 -ProjectId "YOUR_PROJECT_ID"
```

## Xong! 🎉

Các URL sẽ hiển thị sau khi deploy xong:
- Backend API: `https://rag-backend-xxxxx-uc.a.run.app`
- Frontend: `https://rag-frontend-xxxxx-uc.a.run.app`

## Troubleshooting

### Lỗi "permission denied"
```powershell
# Cấp quyền cho service account
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:YOUR_SERVICE_ACCOUNT" \
  --role="roles/owner"
```

### Lỗi "quota exceeded"
- Kiểm tra quota của project: https://console.cloud.google.com/iam-admin/quotas
- Request tăng quota nếu cần

### Lỗi "VPC connector not ready"
- Đợi 5-10 phút để VPC connector khởi tạo xong
- Check status: `gcloud compute networks vpc-access connectors list --region=asia-southeast1`

### Backend không kết nối Redis
- Verify Redis đã tạo: `gcloud redis instances list --region=asia-southeast1`
- Check VPC connector: `gcloud compute networks vpc-access connectors describe rag-connector --region=asia-southeast1`

## Chi phí ước tính
- **Development/Testing**: ~$5-10/ngày
- **Production (traffic vừa)**: ~$65-100/tháng
- **Production (traffic cao)**: ~$150-300/tháng

## Tips tiết kiệm chi phí
1. Set `--min-instances 0` (tắt khi không dùng)
2. Giảm `--max-instances` trong môi trường dev/test
3. Dùng Redis tier "basic" thay vì "standard"
4. Set up budget alerts

## CI/CD với GitHub Actions
1. Tạo Service Account key:
```bash
gcloud iam service-accounts create github-actions
gcloud iam service-accounts keys create key.json \
  --iam-account=github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

2. Thêm secrets vào GitHub repo:
- `GCP_PROJECT_ID`: Project ID của bạn
- `GCP_SA_KEY`: Nội dung file key.json

3. Push code lên branch `main` → Tự động deploy!
