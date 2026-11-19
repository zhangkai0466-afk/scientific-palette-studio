Option Explicit

' Use a GUI host so PowerShell never creates a visible startup console.
Dim shell, fso, studioRoot, powershellExe, command, argument, exitCode
Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
studioRoot = fso.GetParentFolderName(WScript.ScriptFullName)
powershellExe = shell.ExpandEnvironmentStrings("%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe")

command = Chr(34) & powershellExe & Chr(34) & _
    " -NoProfile -NonInteractive -ExecutionPolicy Bypass -WindowStyle Hidden -File " & _
    Chr(34) & fso.BuildPath(studioRoot, "ensure-localhost.ps1") & Chr(34)

For Each argument In WScript.Arguments
    If LCase(argument) = "-openbrowser" Then
        command = command & " -OpenBrowser"
    Else
        WScript.Quit 2
    End If
Next

shell.CurrentDirectory = studioRoot
exitCode = shell.Run(command, 0, True)
WScript.Quit exitCode
