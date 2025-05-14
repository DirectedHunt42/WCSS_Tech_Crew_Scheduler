; installer.nsi
; NSIS script to install Node.js, Python, npm and pip packages

!include "FileFunc.nsh"
!include "LogicLib.nsh"

Outfile "WCSS_Tech_Crew_Scheduler_Setup.exe"
InstallDir "$PROGRAMFILES\WCSS_Tech_Crew_Scheduler"
RequestExecutionLevel admin

Section "Install"

  SetOutPath "$INSTDIR"
  ; Copy project files
  File /r "c:\Users\jacob\OneDrive\Documents\GitHub\WCSS_Tech_Crew_Scheduler\*.*"

  ; Install Node.js
  ExecWait '"$INSTDIR\node-setup.msi" /quiet'

  ; Install Python
  ExecWait '"$INSTDIR\python-setup.exe" /quiet InstallAllUsers=1 PrependPath=1'

  ; Install Node.js packages
  ExecWait '"$INSTDIR\node_modules\.bin\npm.cmd" install express cors body-parser cookie-parser axios nodemailer' "$INSTDIR\JS"

  ; Install Python packages
  ExecWait '"$INSTDIR\python.exe" -m pip install flask flask-cors bcrypt'

SectionEnd