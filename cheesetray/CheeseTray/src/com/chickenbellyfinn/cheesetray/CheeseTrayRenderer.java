package com.chickenbellyfinn.cheesetray;

import android.content.Context;
import android.content.SharedPreferences;
import android.content.SharedPreferences.OnSharedPreferenceChangeListener;
import android.content.res.Resources;
import android.preference.PreferenceManager;
import android.util.Log;

import com.badlogic.gdx.ApplicationListener;
import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.graphics.GL10;
import com.badlogic.gdx.graphics.OrthographicCamera;
import com.badlogic.gdx.graphics.Texture;
import com.badlogic.gdx.graphics.Texture.TextureFilter;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.graphics.g2d.SpriteBatch;

public class CheeseTrayRenderer implements ApplicationListener, OnSharedPreferenceChangeListener {
	
	private final static String TAG = CheeseTrayRenderer.class.getSimpleName();
	
	private Context _context;
	private Resources _resources;
	private SharedPreferences _preferences;
	
	private float _width, _height;
	
	private OrthographicCamera camera;
	private SpriteBatch batch;
		
	private Texture texture;
	private Sprite sprite;

	int count = 0;

	public CheeseTrayRenderer(Context c, Resources r){
		_context = c;
		_resources = r; 
		_preferences = PreferenceManager.getDefaultSharedPreferences(c);
		_preferences.registerOnSharedPreferenceChangeListener(this);	
	}
	
	@Override
	public void create() {		
		float w = Gdx.graphics.getWidth();
		float h = Gdx.graphics.getHeight();
		
		camera = new OrthographicCamera(w, h);
		batch = new SpriteBatch();

		try{
			texture = new Texture(Gdx.files.external("img.png"));
		} catch(Exception e){
			e.printStackTrace();
			texture = new Texture(Gdx.files.internal("data/libgdx.png"));
		}
		texture.setFilter(TextureFilter.Linear, TextureFilter.Linear);
		sprite = new Sprite(texture);	
		
		onSharedPreferenceChanged(_preferences, "");

	}

	@Override
	public void dispose() {
		batch.dispose();
		texture.dispose();
	}
	
	private void update(){
		count++;
		if(count > 100 && _preferences.getBoolean("update", false)){
			onSharedPreferenceChanged(null, null);
			_preferences.edit().putBoolean("update", false);
			count = 0;
		}
		
		camera.position.set(texture.getWidth()/2, texture.getHeight()/2, 0);
		
		if(texture.getWidth() < texture.getHeight()){
			camera.zoom = texture.getWidth()/_width;			
		} else {
			camera.zoom = texture.getHeight()/_height;
		}
		camera.update();
	}

	@Override
	public void render() { 
		update(); 
		batch.enableBlending();
		Gdx.gl.glClearColor(0f, 0f, 0f, 1);
		Gdx.gl.glClear(GL10.GL_COLOR_BUFFER_BIT);
	
		batch.setProjectionMatrix(camera.combined);
		batch.begin();

		sprite.draw(batch);
		
		batch.end();
	}

	@Override
	public void resize(int width, int height) {
		boolean regen = (_width != width || _height != height);
		_width = width;
		_height = height;		
		Log.d(TAG, _width+","+_height);
	    camera = new OrthographicCamera(width, height);
	    camera.update();
	}

	@Override
	public void pause() {
	}

	@Override
	public void resume() {
	}

	@Override
	public void onSharedPreferenceChanged(SharedPreferences prefs,String key) {

		try{
			texture = new Texture(Gdx.files.external("img.png"));
			sprite = new Sprite(texture);
		} catch (Exception e){
			texture = new Texture(Gdx.files.internal("data/libgdx.png"));
			sprite = new Sprite(texture);
		}
			
	}	
	
}
