@echo off
@chcp 65001 > nul

set VIDEOUTIL_PATH=C:\WebServer\program\Utils\video
set PATH=%PATH%;C:\Program Files\7-Zip;%VIDEOUTIL_PATH%;%VIDEOUTIL_PATH%\mkvtoolnix;%VIDEOUTIL_PATH%\GPAC.Framework.Setup-0.5.1-DEV-rev5457-win32

pushd "{{tmp_dir}}"

copy /y "{{infile}}" "{{outfile}}"

exit
