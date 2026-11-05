s
Resources
Source
Open Graph
Deployment Details
Build Failed
Command "npm run build" exited with 1
Created
github/thomekch-hue
thomekch-hue
5m ago
Status
Error
Latest
Duration
1m 25s
2m ago
Environment
Production
Domains
nadzorbud-3xj7-4iroaucyi-thomekch-4353.vercel.app
Source
Deployed via
Git integration
main
8d7ae0c
Update App.jsx

Deployment Settings
2 Recommendations
Build Logs
1m 25s
62 lines

3

3
Find in logs
Ctrl
F
> vite build
vite v5.4.21 building for production...
transforming...
✓ 5 modules transformed.
x Build failed in 644ms
error during build:
[vite:esbuild] Transform failed with 1 error:
/vercel/path0/src/App.jsx:1367:0: ERROR: Unexpected end of file
file: /vercel/path0/src/App.jsx:1367:0
Unexpected end of file
1365|                <p className="text-xs text-red-600 bg-red-50 border border-red-200 p-3 rounded-xl font-medium">
1366|                  {
1367|  
   |  ^
    at failureErrorWithLog (/vercel/path0/node_modules/esbuild/lib/main.js:1472:15)
    at /vercel/path0/node_modules/esbuild/lib/main.js:755:50
    at responseCallbacks.<computed> (/vercel/path0/node_modules/esbuild/lib/main.js:622:9)
    at handleIncomingPacket (/vercel/path0/node_modules/esbuild/lib/main.js:677:12)
    at Socket.readFromStdout (/vercel/path0/node_modules/esbuild/lib/main.js:600:7)
