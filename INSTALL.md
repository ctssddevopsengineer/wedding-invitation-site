# Clean install

Recommended Node.js: 22.x

```bash
node -v
npm -v
npm cache verify
npm ci
npm test
npm run build
npm run dev
```

If a previous install was interrupted:

```bash
rm -rf node_modules .next
npm cache verify
npm ci --verbose
```

Windows PowerShell:

```powershell
Remove-Item -Recurse -Force node_modules,.next -ErrorAction SilentlyContinue
npm cache verify
npm ci --verbose
```
