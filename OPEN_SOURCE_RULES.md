# Open Source Release Rules & Checklist

## Standard License Template

**ALWAYS use this exact dual license for open source projects:**

```
Dual License

Copyright (c) 2024

This software is dual-licensed:

## Open Source License

Permission is hereby granted, free of charge, to any person or organization with annual gross revenue under $100,000 USD obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Commercial License

For organizations with annual gross revenue of $100,000 USD or more, a commercial license is required. Please contact us for licensing terms and pricing.

Contact: [licensing@your-domain.com]

## Contributing

By contributing to this project, you agree that your contributions will be licensed under the same dual license terms as the project.
```

## Pre-Release Security Audit Checklist

### 🔒 Secrets & Credentials Scan
- [ ] **No hardcoded API keys** - grep for `api[_-]?key`, `secret`, `token`
- [ ] **No passwords** - grep for `password`, `pwd`, `pass`
- [ ] **No database URLs** - check for connection strings, production URLs
- [ ] **Environment variables used** - all secrets use `process.env.VARIABLE_NAME`
- [ ] **API keys hidden in logs** - replace with 'API_KEY_HIDDEN' in console output
- [ ] **No Bearer tokens** - check for hardcoded authentication tokens

### 📦 Dependencies Review  
- [ ] **All MIT/permissive licenses** - run `npm ls --depth=0` and verify licenses
- [ ] **No proprietary packages** - check for commercial-only or restrictive licenses
- [ ] **No internal packages** - ensure no private NPM packages or internal dependencies
- [ ] **Security vulnerabilities** - run `npm audit` and fix high/critical issues

### 🏢 Company/Internal References
- [ ] **No company names** - grep for internal company references
- [ ] **No internal URLs** - check for `.local`, internal domains, private IPs
- [ ] **No proprietary business logic** - remove internal processes, workflows
- [ ] **Generic naming** - project names should be generic, not company-specific
- [ ] **Clean documentation** - remove internal team references, processes

### ⚙️ Environment & Configuration
- [ ] **No production configs** - check Next.js config, environment files
- [ ] **No internal systems** - remove references to internal APIs, databases  
- [ ] **Create .env.example** - provide template for required environment variables
- [ ] **Update contact info** - replace placeholders with actual contact information
- [ ] **Clean git history** - consider if sensitive commits need to be removed

### 🔌 Data Sources & APIs
- [ ] **Only public APIs** - ensure all data sources are publicly accessible
- [ ] **No proprietary data** - remove any internal datasets, proprietary information
- [ ] **API documentation** - document any external API requirements
- [ ] **Rate limiting** - ensure proper handling of public API rate limits
- [ ] **Error handling** - graceful handling of API failures, downtime

### 📋 Documentation & Setup
- [ ] **Clear README** - installation, setup, usage instructions
- [ ] **License included** - LICENSE file with exact dual license text above
- [ ] **Contributing guide** - how others can contribute to the project
- [ ] **Issue templates** - GitHub issue and PR templates
- [ ] **Code of conduct** - standard open source code of conduct
- [ ] **.gitignore updated** - ensure sensitive files are ignored

### 🧪 Quality Assurance
- [ ] **Build succeeds** - `npm run build` works without errors
- [ ] **Tests pass** - run test suite if applicable
- [ ] **Linting clean** - `npm run lint` passes
- [ ] **TypeScript compilation** - `tsc --noEmit` succeeds
- [ ] **Fresh install works** - test `npm install` && `npm run dev` on clean clone

## Licensing Strategy

### Revenue Threshold: $100,000 USD
- **Free tier**: Individuals, startups, small businesses under $100K revenue
- **Commercial tier**: Companies with $100K+ annual revenue need commercial license
- **Optimal balance**: Accessible for small users, monetizable for larger organizations

### License Benefits
- **Developer-friendly**: MIT-style permissions for open source users
- **Business model**: Revenue stream from enterprise customers
- **Community building**: Open source fosters adoption and contributions
- **Legal clarity**: Clear terms for both free and commercial usage

## Release Process
1. **Run complete checklist** above
2. **Test fresh installation** from clean repository
3. **Update version numbers** in package.json and documentation  
4. **Tag release** with semantic versioning
5. **Publish to GitHub** with clear release notes
6. **Announce** on relevant platforms (Reddit, Twitter, dev communities)

---

**Remember**: Open source success requires both great software AND great community engagement. Make sure documentation is excellent and contribution process is clear.