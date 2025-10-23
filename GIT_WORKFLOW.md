# Git Workflow and Development Guidelines

## Branch Structure
- `master`: Production-ready code
- `dev`: Development branch for feature integration
- Feature branches: Create from `dev` for new features

## Getting Started

### Clone the Repository
```bash
git clone https://github.com/sujithsa007/sujithsa007-ai-doc-analyser.git
cd ai-doc-analyser
```

### Switch to Development Branch
```bash
git checkout dev
```

## Development Workflow

### 1. Create Feature Branch
```bash
git checkout dev
git pull origin dev
git checkout -b feature/your-feature-name
```

### 2. Make Changes and Commit
```bash
git add .
git commit -m "feat: your feature description"
```

### 3. Push Feature Branch
```bash
git push origin feature/your-feature-name
```

### 4. Create Pull Request
- Create PR from `feature/your-feature-name` to `dev`
- After review and approval, merge to `dev`
- Delete feature branch after merge

### 5. Deploy to Production
```bash
git checkout master
git merge dev
git push origin master
```

## Commit Message Convention

Use conventional commit messages:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation updates
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Adding/updating tests
- `chore:` - Maintenance tasks

## Repository Information

- **Repository URL**: https://github.com/sujithsa007/sujithsa007-ai-doc-analyser.git
- **Main Branch**: `master`
- **Development Branch**: `dev`
- **Issues**: Report bugs and feature requests via GitHub Issues
- **Discussions**: Use GitHub Discussions for questions and ideas

## File Structure
```
ai-doc-analyser/
├── package.json                  # Root package.json with workspace scripts
├── .gitignore                   # Root gitignore
├── README.md                    # Main project documentation
├── GIT_WORKFLOW.md             # This file - Git workflow guidelines
├── ai-doc-analyser-backend/     # Node.js Express backend
│   ├── .gitignore              # Backend-specific gitignore
│   ├── package.json            # Backend dependencies
│   └── ...                     # Backend source files
└── ai-doc-analyser-frontend/    # React frontend
    ├── .gitignore              # Frontend-specific gitignore
    ├── package.json            # Frontend dependencies
    └── ...                     # Frontend source files
```

## Development Environment Setup

1. **Install Dependencies**:
   ```bash
   npm run install:all
   ```

2. **Start Development Servers**:
   ```bash
   npm run dev
   ```

3. **Run Tests**:
   ```bash
   npm run test
   ```

4. **Build for Production**:
   ```bash
   npm run build
   ```

## Git Configuration

Set your Git credentials:
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## Important Notes

- Always work on the `dev` branch for development
- Create feature branches for new features
- Keep commits atomic and well-described
- Test your changes before pushing
- Update documentation when needed