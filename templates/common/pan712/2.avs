SetWorkingDir("E:\SOFT\AviSynth 2.5\plugins\")
Loadplugin("VSFilter.dll")
#Loadplugin("E:\SOFT\AviSynth 2.5\Sub\Encoding x64\VSFilterMod.dll")
Loadplugin("ffms2.dll")
Loadplugin("E:\SOFT\AviSynth 2.5\Sub\Encoding x64\gradfun2db.dll")
Loadplugin("LSMASHSource.dll") #TS
Loadplugin("LoadPluginEx.dll")
Loadplugin("delogo.dll")


#a=FFVideoSource("E:\SOFT\AviSynth 2.5\Sub\Encoding x64\1.mp4").Trim(0,1490)
#b=FFVideoSource("E:\¥¢¥Ë¥á\×ÖÄ»\Share\saki\07_logo.mp4")
#c=FFVideoSource("E:\SOFT\AviSynth 2.5\Sub\Encoding x64\1.mkv").Trim(1585,0)
#mov=a+b+c
#mov
#trim(2000,5000)
#LWLibavVideoSource("E:\SOFT\AviSynth 2.5\Sub\Encoding x64\1.avi")

FFVideoSource("E:\SOFT\AviSynth 2.5\Sub\Encoding x64\1.mp4")
#Trim(2000,5000)
#EraseLOGO("E:\SOFT\AviSynth 2.5\logo\saki 1280x720.lgd")
#EPSlice(l=1120, t=28, r=92, b=45, sp1="fft3dgpu(sigma=2, plane=4)", spmode=1)
#TextSub("E:\SOFT\AviSynth 2.5\Sub\Encoding x64\1.ass")
#a1=FFVideoSource("E:\SOFT\AviSynth 2.5\Sub\Encoding x64\1.mp4")
#a2=FFVideoSource("E:\SOFT\AviSynth 2.5\Sub\Encoding x64\2.mp4")
#LWLibavVideoSource("E:\SOFT\AviSynth 2.5\Sub\Encoding x64\1.avi")
TextSub("E:\SOFT\AviSynth 2.5\Sub\Encoding x64\1.ass")

#Spline36Resize(640,360,2,0,-2,0)

#a1+a2
gradfun2db(3)
