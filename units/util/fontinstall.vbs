
' util
Set stdout = WScript.StdOut
Set stderr = WScript.StdErr
Set fs = CreateObject("Scripting.FileSystemObject")

Sub WriteErr(message)
  stderr.Write message
End Sub

Sub WriteLineErr(message)
  stderr.WriteLine message
End Sub

Sub Write(message)
  stdout.Write message
End Sub

Sub WriteLine(message)
  stdout.WriteLine message
End Sub

' 获取文件名
Function GetFileName(FilePath)
  'On Error Resume Next
  Dim i, j
  i = Len(FilePath)
  j = InStrRev(FilePath, "\")
  If j <= 0 Then
    GetFileName = ""
  Else
    GetFileName = Mid(FilePath, j + 1, i)
  End If
End Function

' 获取路径
Function GetFilePath(FilePath)
  'On Error Resume Next
  Dim j
  j = InStrRev(FilePath, "\")
  If j <= 0 Then
    GetFilePath = ""
  Else
    GetFilePath = Mid(FilePath, 1, j)
  End If
End Function

Set objArgs = WScript.Arguments
If objArgs.Count < 1 Then
  WriteLineErr "No enough arguments"
  WScript.Quit 1
End If

Dim path
path = objArgs(0)

If Not fs.fileExists(path) Then
  WriteLineErr "File not exists"
  WScript.Quit 1
End If

Dim folder, fname
folder = GetFilePath(path)
fname = GetFileName(path)

If Len(folder) > 0 And Len(fname) > 0 Then
  Set objShell = CreateObject("Shell.Application")
  Set objFolder = objShell.Namespace(folder)
  Set objFolderItem = objFolder.ParseName(fname)
  objFolderItem.InvokeVerb("Install")
Else
  WriteLineErr "Can't split path properly"
  WScript.Quit 1
End If
