@echo off
echo Building Genzo-Kit (x86_64-pc-windows-msvc)...
cargo tauri build --target x86_64-pc-windows-msvc
echo Build complete.
pause
