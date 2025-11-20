# Quick Reference: Security and Performance Tools

## 🚀 Quick Commands

### Daily Development
```bash
npm run dev              # Start development server
npm run lint:fix         # Fix linting issues
npm run format           # Format all code
npm test                 # Run tests
```

### Before Commit
```bash
npm run audit            # Full security audit
npm run coverage         # Check test coverage
```

### Analysis
```bash
npm run test:gas         # Gas usage report
npm run size             # Contract size check
npm run build            # Production build + analysis
```

---

## 🛠️ Tool Overview

| Tool | Purpose | Command |
|------|---------|---------|
| **solhint** | Solidity linting | `npm run lint:sol` |
| **ESLint** | JS/TS linting | `npm run lint:js` |
| **Prettier** | Code formatting | `npm run format` |
| **Hardhat** | Contract development | `npm run compile` |
| **Gas Reporter** | Gas optimization | `npm run test:gas` |
| **Husky** | Pre-commit hooks | Auto-runs on commit |
| **TypeScript** | Type safety | Auto-checked on build |

---

## 📋 Security Checklist

### Code Review
- [ ] No tx.origin usage
- [ ] All external calls checked
- [ ] Access control modifiers used
- [ ] Input validation present
- [ ] Rate limiting where needed
- [ ] Gas limits considered

### Testing
- [ ] All functions tested
- [ ] Edge cases covered
- [ ] Gas usage acceptable
- [ ] Security tests pass
- [ ] Coverage > 90%

### Pre-deployment
- [ ] Contract size < 24KB
- [ ] Optimizer verified
- [ ] All tests passing
- [ ] Security audit complete
- [ ] Gas report reviewed

---

## 🔧 Configuration Files

```
.eslintrc.json       → ESLint rules
.prettierrc.json     → Formatting rules
.solhint.json        → Solidity rules
hardhat.config.ts    → Hardhat settings
tsconfig.json        → TypeScript config
esbuild.config.js    → Build config
package.json         → Scripts + deps
```

---

## 🐛 Troubleshooting

### Husky not working
```bash
npm run prepare
chmod +x .husky/*
```

### Linting errors
```bash
npm run lint:fix
npm run format
```

### Tests failing
```bash
npx hardhat clean
npm test
```

### Build errors
```bash
npm run clean
npm run build
```

---

## 📊 Gas Optimization Tips

1. **Use events for data storage** (2,000 gas vs 20,000)
2. **Batch operations** when possible
3. **Limit array iterations** (max 50)
4. **Use uint256** over smaller types in most cases
5. **Pack storage variables** efficiently
6. **Cache storage reads** in memory
7. **Use custom errors** instead of strings

---

## 🔐 Security Best Practices

1. **Always validate inputs**
2. **Use modifiers for access control**
3. **Implement rate limiting** for public functions
4. **Check contract size** regularly
5. **Test with various scenarios**
6. **Review gas usage** patterns
7. **Monitor CI/CD** results
8. **Update dependencies** regularly

---

## 📈 Metrics to Monitor

### Code Quality
- ESLint errors: **0**
- Test coverage: **> 90%**
- Code complexity: **< 15**

### Performance
- Bundle size: **< 500KB**
- Contract size: **< 24KB**
- Gas per tx: **< 200K**

### Security
- Vulnerabilities: **0**
- Solhint warnings: **0**
- Failed tests: **0**

---

## 🎯 CI/CD Status

Check `.github/workflows/` for:
- ✅ Security audit
- ✅ Continuous integration
- ✅ Gas reporting
- ✅ Bundle analysis

View results in GitHub Actions tab.

---

## 📞 Common Issues

**Issue:** Pre-commit hook fails
**Solution:** Run `npm run lint:fix && npm run format`

**Issue:** Gas too high
**Solution:** Check `gas-report.txt`, optimize hot paths

**Issue:** Contract too large
**Solution:** Split into libraries, remove unused code

**Issue:** CI/CD failing
**Solution:** Check logs in GitHub Actions

---

## 🔗 Resources

- Hardhat: https://hardhat.org
- Solhint: https://github.com/protofire/solhint
- ESLint: https://eslint.org
- TypeScript: https://www.typescriptlang.org
- ESBuild: https://esbuild.github.io

---

## 💡 Pro Tips

1. **Use watch mode** during development: `npm run dev`
2. **Enable gas reporting** to find optimization targets
3. **Run full audit** before creating PR
4. **Review bundle analysis** after adding dependencies
5. **Check security tests** regularly
6. **Monitor CI/CD** for early warnings
7. **Keep dependencies** up to date

---

**Happy coding! All tools are configured and ready.** 🎉
