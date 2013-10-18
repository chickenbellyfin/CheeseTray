package com.chickenbellyfinn.cheesetray;
import android.os.Build;
import android.util.Log;

import com.badlogic.gdx.ApplicationListener;
import com.badlogic.gdx.backends.android.AndroidApplicationConfiguration;
import com.badlogic.gdx.backends.android.AndroidLiveWallpaperService;


public class CheeseTrayService extends AndroidLiveWallpaperService  {
	
	private static final String TAG = CheeseTrayService.class.getSimpleName();
	
	private static final String[] noAADevice = {
		"mako",
	};

	
	private boolean deviceAASafe(){
		String device = Build.DEVICE;  
		Log.v(TAG, "detected device: "+device);
		for(int i = 0; i < noAADevice.length;i++){
			if(device.equalsIgnoreCase(noAADevice[i])){
				Log.v(TAG, "AA disabled");
				return false;
			}
		}		
		return true;
	}

	@Override
	public AndroidApplicationConfiguration createConfig() {
		AndroidApplicationConfiguration conf = new AndroidApplicationConfiguration();
		
		return conf;
	}

	@Override
	public ApplicationListener createListener(boolean arg0) {

		return new CheeseTrayRenderer(getBaseContext(), getResources());
	}

	@Override
	public void offsetChange(ApplicationListener arg0, float arg1, float arg2,
			float arg3, float arg4, int arg5, int arg6) {
		
	}
}
