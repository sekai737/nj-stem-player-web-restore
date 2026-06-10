; NewJeans Stem Library Installer — pure NSIS (no Electron)
; Downloads stems.zip from Archive.org and extracts to Program Files.

Unicode true

!include "MUI2.nsh"
!include "LogicLib.nsh"
!include "nsDialogs.nsh"

!ifndef PRODUCT_VERSION
  !define PRODUCT_VERSION "1.0.0"
!endif
!define PRODUCT_NAME "NewJeans Stem Library Installer"
!define STEMS_DIR "C:\Program Files\NewJeans Stem Player\stems"
!define /date BUILD_DATE "%Y-%m-%d"

Name "${PRODUCT_NAME}"
OutFile "${OUTFILE}"
InstallDir "C:\Program Files\NewJeans Stem Player"
RequestExecutionLevel admin
ShowInstDetails show

!define MUI_ABORTWARNING
!define MUI_ICON "..\..\build\icon.ico"
!define MUI_UNICON "..\..\build\icon.ico"

!insertmacro MUI_PAGE_WELCOME
Page custom StemPathPage StemPathPageLeave
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "English"

Var StemPathLabel

Function StemPathPage
  !insertmacro MUI_HEADER_TEXT "Install location" "Stem audio will be installed to the path below."
  nsDialogs::Create 1018
  Pop $0
  ${NSD_CreateLabel} 0 0 100% 24u "The NewJeans Stem Player reads stems from this folder on launch:"
  Pop $0
  ${NSD_CreateLabel} 0 28u 100% 24u "${STEMS_DIR}"
  Pop $StemPathLabel
  CreateFont $0 "$(^Font)" 9 700
  SendMessage $StemPathLabel ${WM_SETFONT} $0 0
  ${NSD_CreateLabel} 0 60u 100% 36u "The installer downloads ~1.6 GB from Archive.org. An internet connection is required."
  Pop $0
  nsDialogs::Show
FunctionEnd

Function StemPathPageLeave
FunctionEnd

Section "Stem library" SecStem
  SetOutPath "$PLUGINSDIR"
  File "install-stems.ps1"

  DetailPrint "Downloading and installing stem audio from Archive.org..."
  DetailPrint "This may take several minutes depending on your connection."

  nsExec::ExecToLog 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$PLUGINSDIR\install-stems.ps1" -StemsDir "${STEMS_DIR}"'
  Pop $0

  ${If} $0 != 0
    MessageBox MB_OK|MB_ICONSTOP "Stem install failed (exit code $0).$\r$\n$\r$\nCheck your internet connection and run Stem Library Installer again."
    Abort
  ${EndIf}

  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\NewJeansStemLibrary" "DisplayName" "${PRODUCT_NAME}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\NewJeansStemLibrary" "UninstallString" "$INSTDIR\Uninstall Stem Library.exe"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\NewJeansStemLibrary" "DisplayVersion" "${PRODUCT_VERSION}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\NewJeansStemLibrary" "Publisher" "sekai737"
  WriteUninstaller "$INSTDIR\Uninstall Stem Library.exe"

  CreateDirectory "$SMPROGRAMS\NewJeans Stem Player"
  CreateShortCut "$SMPROGRAMS\NewJeans Stem Player\Stem Library Installer.lnk" "$EXEPATH" "" "$EXEPATH" 0
SectionEnd

Section "Uninstall"
  RMDir /r "${STEMS_DIR}"
  Delete "$INSTDIR\Uninstall Stem Library.exe"
  Delete "$SMPROGRAMS\NewJeans Stem Player\Stem Library Installer.lnk"
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\NewJeansStemLibrary"
SectionEnd
