@echo off
@chcp 65001 > nul

set VIDEOUTIL_PATH=C:\WebServer\program\Utils\video
set PATH=%PATH%;C:\Program Files\7-Zip;%VIDEOUTIL_PATH%;%VIDEOUTIL_PATH%\mkvtoolnix;%VIDEOUTIL_PATH%\GPAC.Framework.Setup-0.5.1-DEV-rev5457-win32
set BASE_NAME={{bangumi}} {{episode}}
set ANIME_NAME_PREFIX=[KNA][{{bangumi}}][{{episode}}]

pushd "{{tmp_dir}}"

copy /y "{{infile}}" "{{working_dir}}"

pushd "{{working_dir}}"

rename *.mp4 "%BASE_NAME%.mp4"
MP4Box.exe -raw 2 "%BASE_NAME%.mp4"
rename *.aac "%BASE_NAME%.aac"

x264_32_tMod-8bit-all.exe --crf 24 --rc-lookahead 80 --merange 24 --min-keyint 1 --cqm "jvt" --keyint 500 --me umh --subme 9 --device psv+dxva --threads 18 --output "%ANIME_NAME_PREFIX%.264" "{{avsfile}}"

MP4Box.exe -add "%ANIME_NAME_PREFIX%.264:fps=23.976" -add "%BASE_NAME%.aac" -itags tool="(KNA Cloud Service) tengattack" "%ANIME_NAME_PREFIX%.mp4"

move /y "%ANIME_NAME_PREFIX%.mp4" "{{outfile}}"

del /q /f "%ANIME_NAME_PREFIX%.*"
del /q /f "%BASE_NAME%.*"

exit
