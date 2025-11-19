# 将 client 推送到新的 GitHub 仓库

## 步骤 1: 在 GitHub 上创建新仓库

1. 访问 https://github.com/new
2. 填写仓库信息：
   - **Repository name**: 输入你想要的仓库名称（例如：`globe-client`）
   - **Description**: 可选，填写项目描述
   - **Visibility**: 选择 Public 或 Private
   - **不要**勾选 "Initialize this repository with a README"（因为本地已有代码）
3. 点击 "Create repository"

## 步骤 2: 添加新的远程仓库并推送

创建仓库后，GitHub 会显示仓库 URL。使用以下命令：

```bash
# 添加新的远程仓库（将 YOUR_USERNAME 和 REPO_NAME 替换为你的实际值）
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# 或者使用 SSH（如果你配置了 SSH 密钥）
# git remote add origin git@github.com:YOUR_USERNAME/REPO_NAME.git

# 推送代码到新仓库
git push -u origin master
```

## 示例

如果你的 GitHub 用户名是 `yourname`，仓库名是 `globe-client`，则命令为：

```bash
git remote add origin https://github.com/yourname/globe-client.git
git push -u origin master
```

## 注意事项

- 如果新仓库的主分支是 `main` 而不是 `master`，使用：
  ```bash
  git push -u origin master:main
  ```
  或者先重命名本地分支：
  ```bash
  git branch -M main
  git push -u origin main
  ```

