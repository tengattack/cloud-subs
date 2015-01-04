Loadplugin("C:\WebServer\program\Utils\video\avisynth_plugin\VSFilterMod.dll")
Loadplugin("C:\WebServer\program\Utils\video\avisynth_plugin\gradfun2db\gradfun2db.dll")
Loadplugin("C:\WebServer\program\Utils\video\avisynth_plugin\ffms2-2.19\ffms2.dll")

# , fpsnum = 24000, fpsden = 1001
FFVideoSource("{{bangumi}} {{episode}}.mp4", fpsnum = 24000, fpsden = 1001)
#DirectShowSource("{{bangumi}} {{episode}}.mp4",fps=23.976,convertfps=true,audio=false)
#GradFun3(thr=0.35)
gradfun2db(3)
TextSubMod("{{assfile}}")
