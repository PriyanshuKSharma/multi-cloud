pipeline {
    agent any

    environment {
        // Docker Hub Credentials ID configured in Jenkins
        DOCKER_HUB_CREDENTIALS_ID = 'docker-hub-credentials'
        
        // Docker Hub Repository Names
        DOCKERHUB_USERNAME = 'priyanshuksharma'
        BACKEND_IMAGE = "${DOCKERHUB_USERNAME}/multi-cloud-backend"
        FRONTEND_IMAGE = "${DOCKERHUB_USERNAME}/multi-cloud-frontend"
        CELERY_IMAGE = "${DOCKERHUB_USERNAME}/multi-cloud-celery-worker"
        
        // Image Tag
        IMAGE_TAG = "v${BUILD_NUMBER}.0.0"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build & Push Backend & Celery') {
            steps {
                script {
                    echo "Building Backend & Celery Image: ${BACKEND_IMAGE}:${IMAGE_TAG}"
                    sh "docker build -t ${BACKEND_IMAGE}:${IMAGE_TAG} -t ${BACKEND_IMAGE}:latest ./backend"
                    
                    // Tag for Celery Worker (uses same backend image)
                    sh "docker tag ${BACKEND_IMAGE}:${IMAGE_TAG} ${CELERY_IMAGE}:${IMAGE_TAG}"
                    sh "docker tag ${BACKEND_IMAGE}:${IMAGE_TAG} ${CELERY_IMAGE}:latest"
                    
                    echo "Pushing Images to Docker Hub"
                    withCredentials([usernamePassword(credentialsId: DOCKER_HUB_CREDENTIALS_ID, usernameVariable: 'DOCKERHUB_USER', passwordVariable: 'DOCKERHUB_PASS')]) {
                        sh "echo ${DOCKERHUB_PASS} | docker login -u ${DOCKERHUB_USER} --password-stdin"
                        
                        sh "docker push ${BACKEND_IMAGE}:${IMAGE_TAG}"
                        sh "docker push ${BACKEND_IMAGE}:latest"
                        
                        sh "docker push ${CELERY_IMAGE}:${IMAGE_TAG}"
                        sh "docker push ${CELERY_IMAGE}:latest"
                    }
                }
            }
        }

        stage('Build & Push Frontend') {
            steps {
                script {
                    echo "Building Frontend Image: ${FRONTEND_IMAGE}:${IMAGE_TAG}"
                    sh "docker build -t ${FRONTEND_IMAGE}:${IMAGE_TAG} -t ${FRONTEND_IMAGE}:latest ./frontend"
                    
                    echo "Pushing Frontend Image to Docker Hub"
                    withCredentials([usernamePassword(credentialsId: DOCKER_HUB_CREDENTIALS_ID, usernameVariable: 'DOCKERHUB_USER', passwordVariable: 'DOCKERHUB_PASS')]) {
                        sh "echo ${DOCKERHUB_PASS} | docker login -u ${DOCKERHUB_USER} --password-stdin"
                        sh "docker push ${FRONTEND_IMAGE}:${IMAGE_TAG}"
                        sh "docker push ${FRONTEND_IMAGE}:latest"
                    }
                }
            }
        }

        stage('Logout') {
            steps {
                sh "docker logout"
            }
        }

        stage('Cleanup') {
            steps {
                sh "docker rmi ${BACKEND_IMAGE}:${IMAGE_TAG} ${BACKEND_IMAGE}:latest || true"
                sh "docker rmi ${FRONTEND_IMAGE}:${IMAGE_TAG} ${FRONTEND_IMAGE}:latest || true"
                sh "docker rmi ${CELERY_IMAGE}:${IMAGE_TAG} ${CELERY_IMAGE}:latest || true"
            }
        }
    }

    post {
        always {
            echo "Pipeline finished."
        }
        success {
            echo "Successfully built and pushed images to Docker Hub."
        }
        failure {
            echo "Pipeline failed. Check logs for details."
        }
    }
}
