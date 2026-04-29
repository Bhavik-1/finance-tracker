const path = require("path");

module.exports = {
  apps: [
    {
      name: "finance-tracker",
      cwd: path.resolve(__dirname, ".."),
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
