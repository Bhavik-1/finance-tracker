FROM jenkins/jenkins:lts

USER root

# Install dependencies
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
     ca-certificates \
     curl \
     gnupg \
     lsb-release \
     nodejs \
     npm \
  && mkdir -p /etc/apt/keyrings

# Add Docker official GPG key
RUN curl -fsSL https://download.docker.com/linux/debian/gpg \
  | gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Add Docker repo
RUN echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/debian \
  $(lsb_release -cs) stable" \
  > /etc/apt/sources.list.d/docker.list

# Install Docker CLI
RUN apt-get update \
  && apt-get install -y docker-ce-cli \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

# Create docker group and add jenkins user
RUN groupadd docker \
  && usermod -aG docker jenkins

USER jenkins