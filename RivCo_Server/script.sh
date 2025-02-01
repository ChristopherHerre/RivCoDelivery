docker buildx build --platform linux/amd64 -t gcr.io/mimetic-surf-124908/backend .
docker push gcr.io/mimetic-surf-124908/backend
gcloud run deploy backend   --image gcr.io/mimetic-surf-124908/backend   --platform managed   --region us-west3   --allow-unauthenticated
