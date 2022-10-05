@echo off

For /F "Skip=2Tokens=2*" %%A In ('Reg Query HKCU\Environment /V PATH 2^>Nul') Do set "loc_path=%%B"

echo insert pythonpath
set /p py_path=

setx Path %py_path%;%loc_path%

pause