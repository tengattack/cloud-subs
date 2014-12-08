Loadplugin("D:\Software\video\avisynth_plugin\VSFilter.dll")
Loadplugin("D:\Software\video\avisynth_plugin\gradfun2db\gradfun2db.dll")
Loadplugin("D:\Software\video\avisynth_plugin\ffms2-2.19\ffms2.dll")

# , fpsnum = 24000, fpsden = 1001
FFVideoSource("Honoka_To_Shizuku_No_Mahoujuku {{episode}}.mp4", fpsnum = 24000, fpsden = 1001)
#DirectShowSource("Honoka_To_Shizuku_No_Mahoujuku {{episode}}.mp4",fps=23.976,convertfps=true,audio=false)
#GradFun3(thr=0.35)
gradfun2db(3)
TextSub("{{assfile}}")
