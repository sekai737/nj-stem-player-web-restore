!include "LogicLib.nsh"
!include "nsDialogs.nsh"

!define NJSP_DEFAULT_STEMS_DIR "C:\Program Files\NewJeans Stem Player\stems"
!define NJSP_REG_KEY "Software\com.sekai737.nj-stem-player"

!ifndef BUILD_UNINSTALLER
Var NJSP_DownloadStems
Var NJSP_StemsDir
Var NJSP_DownloadCheckbox
Var NJSP_StemsPathField
Var NJSP_StemsBrowseBtn

!macro customPageAfterChangeDir
  Page custom njspStemOptInPage njspStemOptInPageLeave
  Page custom njspStemPathPage njspStemPathPageLeave
!macroend

Function njspStemOptInPage
  nsDialogs::Create 1018
  Pop $0
  ${If} $0 == error
    Abort
  ${EndIf}

  ${NSD_CreateLabel} 0 0 100% 16u "Stem audio library"
  Pop $0
  CreateFont $1 "$(^Font)" 9 700
  SendMessage $0 ${WM_SETFONT} $1 0

  ${NSD_CreateLabel} 0 20u 100% 32u "The stem audio pack is required for playback. You can install it now as part of this setup (~1.6 GB). An internet connection is required."
  Pop $0

  ${NSD_CreateCheckbox} 0 58u 100% 14u "Download and install stem audio library"
  Pop $NJSP_DownloadCheckbox
  ${NSD_Check} $NJSP_DownloadCheckbox

  nsDialogs::Show
FunctionEnd

Function njspStemOptInPageLeave
  ${NSD_GetState} $NJSP_DownloadCheckbox $0
  ${If} $0 == ${BST_CHECKED}
    StrCpy $NJSP_DownloadStems 1
  ${Else}
    StrCpy $NJSP_DownloadStems 0
  ${EndIf}
FunctionEnd

Function njspStemPathPage
  ${If} $NJSP_DownloadStems != 1
    Abort
  ${EndIf}

  nsDialogs::Create 1018
  Pop $0
  ${If} $0 == error
    Abort
  ${EndIf}

  ${NSD_CreateLabel} 0 0 100% 16u "Stem install location"
  Pop $0
  CreateFont $1 "$(^Font)" 9 700
  SendMessage $0 ${WM_SETFONT} $1 0

  ${NSD_CreateLabel} 0 22u 100% 24u "Stem folder:"
  Pop $0

  ${NSD_CreateText} 0 48u 78% 12u "${NJSP_DEFAULT_STEMS_DIR}"
  Pop $NJSP_StemsPathField

  ${NSD_CreateBrowseButton} 80% 46u 20% 14u "Browse…"
  Pop $NJSP_StemsBrowseBtn
  ${NSD_OnClick} $NJSP_StemsBrowseBtn njspBrowseStemsDir

  ${NSD_CreateLabel} 0 70u 100% 28u "Keeping the default location is recommended. If you choose another folder, the player will also look there for stems on launch."
  Pop $0

  nsDialogs::Show
FunctionEnd

Function njspBrowseStemsDir
  ${NSD_GetText} $NJSP_StemsPathField $0
  nsDialogs::SelectFolderDialog "Select stem library folder" $0
  Pop $0
  ${If} $0 != error
    StrCpy $NJSP_StemsDir $0
    ${NSD_SetText} $NJSP_StemsPathField $0
  ${EndIf}
FunctionEnd

Function njspStemPathPageLeave
  ${NSD_GetText} $NJSP_StemsPathField $NJSP_StemsDir
  ${If} $NJSP_StemsDir == ""
    MessageBox MB_OK|MB_ICONEXCLAMATION "Please choose a folder for the stem audio library."
    Abort
  ${EndIf}
FunctionEnd

!macro njspRunStemInstall
  File /oname=$PLUGINSDIR\install-stems.ps1 "${BUILD_RESOURCES_DIR}\install-stems.ps1"
  File /oname=$PLUGINSDIR\windows-paths.json "${BUILD_RESOURCES_DIR}\windows-paths.json"

  DetailPrint "Downloading and installing stem audio library..."
  DetailPrint "This may take several minutes depending on your connection."

  ${If} $NJSP_StemsDir == ""
    StrCpy $NJSP_StemsDir "${NJSP_DEFAULT_STEMS_DIR}"
  ${EndIf}

  ${If} $NJSP_StemsDir != "${NJSP_DEFAULT_STEMS_DIR}"
    StrCpy $R9 "powershell.exe -NoProfile -ExecutionPolicy Bypass -File $\"$PLUGINSDIR\install-stems.ps1$\" -StemsDir $\"$NJSP_StemsDir$\" -PersistCustomLocation -PathsFile $\"$PLUGINSDIR\windows-paths.json$\""
  ${Else}
    StrCpy $R9 "powershell.exe -NoProfile -ExecutionPolicy Bypass -File $\"$PLUGINSDIR\install-stems.ps1$\" -StemsDir $\"$NJSP_StemsDir$\" -PathsFile $\"$PLUGINSDIR\windows-paths.json$\""
  ${EndIf}
  nsExec::ExecToLog $R9
  Pop $0

  ${If} $0 != 0
    MessageBox MB_OK|MB_ICONSTOP "Stem library install failed (exit code $0).$\r$\n$\r$\nCheck your internet connection and try running setup again."
    Abort
  ${EndIf}

  WriteRegStr HKLM "${NJSP_REG_KEY}" "StemsDir" "$NJSP_StemsDir"
  WriteRegDWORD HKLM "${NJSP_REG_KEY}" "StemsInstalledBySetup" 1
!macroend

!macro customInstall
  ${If} $NJSP_DownloadStems == 1
    !insertmacro njspRunStemInstall
  ${EndIf}
!macroend

!macro customUnInstall
  File /nonfatal /oname=$PLUGINSDIR\uninstall-cleanup.ps1 "${BUILD_RESOURCES_DIR}\uninstall-cleanup.ps1"
  File /nonfatal /oname=$PLUGINSDIR\windows-paths.json "${BUILD_RESOURCES_DIR}\windows-paths.json"

  DetailPrint "Removing NewJeans Stem Player user data, cache, and registry entries..."
  StrCpy $R9 "powershell.exe -NoProfile -ExecutionPolicy Bypass -File $\"$PLUGINSDIR\uninstall-cleanup.ps1$\" -InstallDir $\"$INSTDIR$\" -PathsFile $\"$PLUGINSDIR\windows-paths.json$\""
  nsExec::ExecToLog $R9
  Pop $0
!macroend

!macro customInit
  StrCpy $NJSP_DownloadStems 0
  StrCpy $NJSP_StemsDir "${NJSP_DEFAULT_STEMS_DIR}"
!macroend
!endif
