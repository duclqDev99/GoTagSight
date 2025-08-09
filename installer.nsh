!macro customInstall
  ; Kiểm tra và dừng process cũ nếu đang chạy
  nsProcess::_FindProcess "GoTagSight.exe"
  Pop $R0
  ${If} $R0 = 0
    DetailPrint "Đang dừng GoTagSight cũ..."
    nsProcess::_KillProcess "GoTagSight.exe"
    Pop $R0
    Sleep 2000
  ${EndIf}
  
  ; Xóa shortcut cũ nếu có
  Delete "$DESKTOP\GoTagSight.lnk"
  Delete "$SMPROGRAMS\GoTagSight\GoTagSight.lnk"
  RMDir "$SMPROGRAMS\GoTagSight"
  
  ; Xóa registry entries cũ
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\GoTagSight"
  DeleteRegKey HKLM "Software\GoTagSight"
  
  DetailPrint "Đã xóa dữ liệu cũ và sẵn sàng cài đặt phiên bản mới"
!macroend

!macro customUnInstall
  ; Dừng process nếu đang chạy
  nsProcess::_FindProcess "GoTagSight.exe"
  Pop $R0
  ${If} $R0 = 0
    DetailPrint "Đang dừng GoTagSight..."
    nsProcess::_KillProcess "GoTagSight.exe"
    Pop $R0
    Sleep 2000
  ${EndIf}
  
  ; Xóa shortcut
  Delete "$DESKTOP\GoTagSight.lnk"
  Delete "$SMPROGRAMS\GoTagSight\GoTagSight.lnk"
  RMDir "$SMPROGRAMS\GoTagSight"
  
  ; Xóa registry entries
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\GoTagSight"
  DeleteRegKey HKLM "Software\GoTagSight"
  
  ; Xóa dữ liệu app (config files)
  RMDir /r "$APPDATA\GoTagSight"
  
  DetailPrint "Đã gỡ cài đặt hoàn toàn GoTagSight"
!macroend 