@echo off

set VIDEOUTIL_PATH=D:\Software\video
set PATH=%PATH%;D:\Program Files\7-Zip;%VIDEOUTIL_PATH%;%VIDEOUTIL_PATH%\mkvtoolnix;%VIDEOUTIL_PATH%\GPAC.Framework.Setup-0.5.1-DEV-rev5457-win32
set BASE_NAME=Honoka_To_Shizuku_No_Mahoujuku {{episode}}
set ANIME_NAME_PREFIX=[KNA][{{bangumi}}][{{episode}}]

pushd "{{tmp_dir}}"

7z x "{{infile}}" -o"{{working_dir}}"

pushd "{{working_dir}}"

rename *.mp4 "%BASE_NAME%.mp4"
MP4Box.exe -raw 2 "%BASE_NAME%.mp4"
rename *.aac "%BASE_NAME%.aac"

x264_32_tMod-8bit-all.exe --level 3.1 --pass 1 --crf 19 --min-keyint 23 --bframes 5 --b-pyramid strict --ref 5 --qpmax 49 --vbv-bufsize 17500 --vbv-maxrate 17500 --cqm "jvt" --keyint 500 --me umh --subme 9 --aq-strength 1.0 --aq-mode 4 --fade-compensate 0.40 --merange 8 --direct auto --device psv+dxva --threads 18 --stats "%ANIME_NAME_PREFIX%.stats" --output NUL "{{avsfile}}"
x264_32_tMod-8bit-all.exe --level 3.1 --pass 2 --bitrate 900 --min-keyint 23 --bframes 5 --b-pyramid strict --ref 5 --qpmax 49 --vbv-bufsize 17500 --vbv-maxrate 17500 --cqm "jvt" --keyint 500 --me umh --subme 12 --aq-strength 1.0 --aq-mode 4 --fade-compensate 0.40 --merange 32 --direct auto --device psv+dxva --threads 18 --stats "%ANIME_NAME_PREFIX%.stats" --output "%ANIME_NAME_PREFIX%.264" "{{avsfile}}"

MP4Box.exe -add "%ANIME_NAME_PREFIX%.264:fps=23.976" -add "%BASE_NAME%.aac" -itags tool="(KNA-sub) tengattack" "%ANIME_NAME_PREFIX%.mp4"

move /y "%ANIME_NAME_PREFIX%.mp4" "{{outfile}}"

del /q /f "%ANIME_NAME_PREFIX%.*"
del /q /f "%BASE_NAME%.*"

exit
