# Jenkins + Finance Tracker Demo Guide

Use this guide to demonstrate:
- Jenkins running in Docker
- Pipeline building app image
- Pipeline running app container
- Application accessible in browser

## 1. One-time setup (if not already done)

Run from `C:\Users\DELL\Desktop\codex`:

```powershell
docker volume create jenkins_home
docker build --no-cache -f docker/jenkins.Dockerfile -t finance-jenkins:lts .
docker rm -f jenkins
docker run -d --name jenkins --user root -p 8080:8080 -p 50000:50000 -v jenkins_home:/var/jenkins_home -v /var/run/docker.sock:/var/run/docker.sock finance-jenkins:lts
docker exec jenkins docker --version
```

Expected: Docker version prints from inside Jenkins container.

## 2. Start services before demo day

```powershell
docker start jenkins
docker rm -f finance-mongo finance-tracker-test
docker run -d --name finance-mongo -p 27017:27017 mongo:7
docker ps --filter "name=jenkins"
docker ps --filter "name=finance-mongo"
```

## 3. Jenkins job configuration (UI)

Open: `http://localhost:8080`

In your pipeline job (`finance-tracker-pipeline`) ensure:
- Definition: `Pipeline script from SCM`
- SCM: `Git`
- Repository URL: `https://github.com/Bhavik-1/finance-tracker.git`
- Branch Specifier: `*/main`
- Script Path: `jenkins/Jenkinsfile`

Save.

## 4. Run pipeline live

In Jenkins UI:
1. Open `finance-tracker-pipeline`
2. Click `Build Now`
3. Open `Console Output`

Show that these stages pass:
- Clone Repo
- Build Docker Image
- Run Container
- Final status: `Finished: SUCCESS`

## 5. Verify from terminal (proof commands)

```powershell
docker ps --filter "name=jenkins"
docker ps -a --filter "name=finance-tracker-test"
docker logs --tail 50 finance-tracker-test
```

If running, open:
- `http://localhost:5000`

## 6. If app container exits (quick fix)

Run:

```powershell
docker rm -f finance-tracker-test
docker run -d --name finance-tracker-test -p 5000:5000 -e NODE_ENV=production -e PORT=5000 -e MONGODB_URI=mongodb://host.docker.internal:27017/expense_tracker -e JWT_SECRET=demo_secret finance-tracker:latest
docker ps --filter "name=finance-tracker-test"
docker logs --tail 100 finance-tracker-test
```

Then open `http://localhost:5000`.

## 7. Demo script (what to say)

1. "This Jenkins is running in Docker on port 8080 with persistent volume."
2. "Pipeline is connected to GitHub and uses Jenkinsfile from the repo."
3. "On Build Now, Jenkins clones code, builds Docker image, and runs test container."
4. "Here is the running container and application endpoint."

## 8. Cleanup after demo

```powershell
docker stop finance-tracker-test finance-mongo
```

Optional full cleanup:

```powershell
docker rm -f finance-tracker-test finance-mongo
```

