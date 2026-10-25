
pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    environment {
        IMAGE_NAME = 'knighthitesh/learnsphere'
        APP1_HOST  = '13.206.120.196'
        APP2_HOST  = '3.108.67.108'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                sh 'git log -1 --oneline'
            }
        }

        stage('Validate Application') {
            steps {
                sh 'test -f Dockerfile'
                sh 'test -f app.js'
                sh 'test -f package.json'
                sh 'npm_version=$(docker --version); echo "$npm_version"'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh '''
                    docker build \
                      --pull \
                      -t ${IMAGE_NAME}:${BUILD_NUMBER} \
                      -t ${IMAGE_NAME}:latest .
                '''
            }
        }

        stage('Test Docker Image') {
            steps {
                sh '''
                    docker run --rm \
                      ${IMAGE_NAME}:${BUILD_NUMBER} \
                      node --check app.js
                '''
            }
        }

        stage('Push Docker Image') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-creds',
                        usernameVariable: 'DH_USER',
                        passwordVariable: 'DH_TOKEN'
                    )
                ]) {
                    sh '''
                        set +x
                        echo "$DH_TOKEN" | docker login \
                          --username "$DH_USER" \
                          --password-stdin

                        docker push ${IMAGE_NAME}:${BUILD_NUMBER}
                        docker push ${IMAGE_NAME}:latest
                        docker logout
                    '''
                }
            }
        }


        stage('Deploy and Verify') {
            steps {
                withCredentials([
                    file(
                        credentialsId: 'app-servers-key',
                        variable: 'SSH_KEY'
                    )
                ]) {
                    sh '''
                        set -eu
                        chmod 600 "$SSH_KEY"

                        for HOST in "$APP1_HOST" "$APP2_HOST"; do
                            echo "Deploying to $HOST"

                            ssh -i "$SSH_KEY" \
                              -o StrictHostKeyChecking=accept-new \
                              ubuntu@"$HOST" \
                              "sudo docker pull ${IMAGE_NAME}:${BUILD_NUMBER} &&
                               (sudo docker rm -f learnsphere || true) &&
                               sudo docker run -d \
                                 --name learnsphere \
                                 --restart unless-stopped \
                                 --env-file /opt/learning-platform/.env \
                                 -p 127.0.0.1:3000:3000 \
                                 ${IMAGE_NAME}:${BUILD_NUMBER}"

                            ssh -i "$SSH_KEY" \
                              -o StrictHostKeyChecking=accept-new \
                              ubuntu@"$HOST" \
                              "sudo docker inspect -f '{{.State.Running}}' learnsphere"
                        done

                        for HOST in "$APP1_HOST" "$APP2_HOST"; do
                            echo "Checking health of $HOST"

                            curl --fail --silent --show-error \
                              --retry 10 --retry-delay 3 \
                              "http://$HOST/health"
                            echo
                        done                       
                    '''
                }
            }
        }
    }
}
