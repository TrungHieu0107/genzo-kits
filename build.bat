@echo off
echo Building Genzo-Kit (x86_64-pc-windows-msvc)...
call npm run tauri build -- --target x86_64-pc-windows-msvc
echo Build complete.
pause
