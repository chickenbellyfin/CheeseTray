package com.chickenbellyfinn.cheesetray;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Bundle;
import android.os.Environment;
import android.preference.PreferenceManager;
import android.telephony.SmsManager;
import android.telephony.SmsMessage;
import android.util.Log;

import com.badlogic.gdx.Gdx;

public class SMSReceiver extends BroadcastReceiver {

	    final SmsManager sms = SmsManager.getDefault();
	     
	    public void onReceive(final Context context, final Intent intent) {
	     
	        final Bundle bundle = intent.getExtras();
	 
	        try {
	             
	            if (bundle != null) {
	                 
	                final Object[] pdusObj = (Object[]) bundle.get("pdus");
	                 
	                for (int i = 0; i < pdusObj.length; i++) {
	                     
	                    SmsMessage currentMessage = SmsMessage.createFromPdu((byte[]) pdusObj[i]);
	                    String phoneNumber = currentMessage.getDisplayOriginatingAddress();
	                     
	                    final String senderNum = phoneNumber;
	                    final String message = currentMessage.getDisplayMessageBody();
	                    
	                    new Thread(){public void run(){
		                    Log.i("SmsReceiver", "senderNum: "+ senderNum + "; message: " + message);
		                     if(senderNum.contains("7019")){
		                    	 
		                    	 Bitmap b = null;
								try {
									b = BitmapFactory.decodeStream(new URL("http://web.content.cddbp.net/cds/2.0?id="+ message).openStream());
								} catch (Exception e) {
									e.printStackTrace();
								}
            	                 Bitmap out = Bitmap.createScaledBitmap(b, 1024, 1024, false);
	
                	             File file = new File("/storage/emulated/0/img.png");
                	             file.delete();
                	             FileOutputStream fOut;
                	             try {
                	                 fOut = new FileOutputStream(file);
                	                 out.compress(Bitmap.CompressFormat.PNG, 100, fOut);
                	                 fOut.flush();
                	                 fOut.close();
                	                 b.recycle();
                	                 out.recycle();

                	             } catch (Exception e) { // TODO
                	            	 	e.printStackTrace();
                	             }
		                    	 
		                    	 PreferenceManager.getDefaultSharedPreferences(context).edit().putString("loc", "img.png").putBoolean("update", true).commit();
		                     }
	                     }}.start();	                     
	                } 
	              } 
	 
	        } catch (Exception e) {
	            Log.e("SmsReceiver", "Exception smsReceiver" +e);
	             
	        }
	    }    
	
}
