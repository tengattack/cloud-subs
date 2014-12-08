@echo off

set PATH=%PATH%;D:\Program Files\7-Zip;D:\Software\video;D:\Software\video\GPAC.Framework.Setup-0.5.1-DEV-rev5457-win32;D:\Software\video\avs2yuv
set BASE_NAME={{bangumi}} {{episode}}
set ANIME_NAME_PREFIX=[KNA][{{bangumi}}][{{episode}}]

pushd "{{tmp_dir}}"

copy /y "{{infile}}" "{{working_dir}}"

pushd "{{working_dir}}"

rename *.mp4 "%BASE_NAME%.mp4"
MP4Box.exe -raw 2 "%BASE_NAME%.mp4"
rename *.aac "%BASE_NAME%.aac"

REM --qpmax 49 --cqm "jvt" --fade-compensate 0.40 --direct auto --device psv+dxva for x264
avs2yuv "{{avsfile}}" - | x265.exe --y4m --level 3.1 --pass 1 --crf 19 --min-keyint 23 --bframes 5 --b-pyramid --ref 5 --vbv-bufsize 17500 --vbv-maxrate 17500 --keyint 500 --me umh --subme 7 --aq-strength 1.0 --aq-mode 1 --merange 8 --threads 18 --stats "%ANIME_NAME_PREFIX%.stats" --output NUL --input -
avs2yuv "{{avsfile}}" - | x265.exe --y4m --level 3.1 --pass 2 --bitrate 600 --min-keyint 23 --bframes 5 --b-pyramid --ref 5 --vbv-bufsize 17500 --vbv-maxrate 17500 --keyint 500 --me umh --subme 7 --aq-strength 1.0 --aq-mode 1 --merange 32 --threads 18 --stats "%ANIME_NAME_PREFIX%.stats" --output "%ANIME_NAME_PREFIX%.hvc" --input -

MP4Box.exe -add "%ANIME_NAME_PREFIX%.hvc:fps=23.976" -add "%BASE_NAME%.aac" -itags tool="cloudsubs by tengattack" "{{outfile}}"

del /q /f "%ANIME_NAME_PREFIX%.*"
del /q /f "%BASE_NAME%.*"

exit
