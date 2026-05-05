package com.shox.pms;

import android.content.Intent;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.util.Log;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

public class IncomingCallActivity extends AppCompatActivity {
    private static final String TAG = "IncomingCallActivity";

    private Ringtone ringtone;
    private Vibrator vibrator;
    private String callId;
    private String callerName;
    private String hotelSlug;
    private String roomNumber;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Lock screen ustida ko'rsatish (eng muhim flaglar)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            getWindow().addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
            );
        }

        setContentView(R.layout.activity_incoming_call);

        // Intent'dan ma'lumotlarni olish
        Intent intent = getIntent();
        callId = intent.getStringExtra("callId");
        callerName = intent.getStringExtra("callerName");
        hotelSlug = intent.getStringExtra("hotelSlug");
        roomNumber = intent.getStringExtra("roomNumber");

        Log.d(TAG, "Call ochildi: " + callerName);

        // UI elementlar
        TextView nameText = findViewById(R.id.callerName);
        TextView statusText = findViewById(R.id.callStatus);
        Button acceptBtn = findViewById(R.id.acceptButton);
        Button declineBtn = findViewById(R.id.declineButton);

        nameText.setText(callerName != null ? callerName : "Hotel");
        statusText.setText("Kelayotgan qongiroq...");

        // Accept tugmasi
        acceptBtn.setOnClickListener(v -> {
            Log.d(TAG, "Accept bosildi");
            stopRingtoneAndVibration();

            // MainActivity'ni ochish va call ma'lumotlarini yuborish
            Intent mainIntent = new Intent(this, MainActivity.class);
            mainIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            mainIntent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
            mainIntent.putExtra("callId", callId);
            mainIntent.putExtra("hotelSlug", hotelSlug);
            mainIntent.putExtra("roomNumber", roomNumber);
            mainIntent.putExtra("acceptCall", true);
            startActivity(mainIntent);

            finish();
        });

        // Decline tugmasi
        declineBtn.setOnClickListener(v -> {
            Log.d(TAG, "Decline bosildi");
            stopRingtoneAndVibration();
            finish();
        });

        // Ringtone va vibratsiya boshlash
        startRingtoneAndVibration();
    }

    private void startRingtoneAndVibration() {
        try {
            Uri ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
            ringtone = RingtoneManager.getRingtone(getApplicationContext(), ringtoneUri);
            if (ringtone != null) {
                ringtone.play();
            }
        } catch (Exception e) {
            Log.e(TAG, "Ringtone xato: " + e.getMessage());
        }

        try {
            vibrator = (Vibrator) getSystemService(VIBRATOR_SERVICE);
            if (vibrator != null && vibrator.hasVibrator()) {
                long[] pattern = {0, 1000, 1000};
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator.vibrate(VibrationEffect.createWaveform(pattern, 0));
                } else {
                    vibrator.vibrate(pattern, 0);
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Vibrator xato: " + e.getMessage());
        }
    }

    private void stopRingtoneAndVibration() {
        try {
            if (ringtone != null && ringtone.isPlaying()) {
                ringtone.stop();
            }
            if (vibrator != null) {
                vibrator.cancel();
            }
        } catch (Exception e) {
            Log.e(TAG, "Stop xato: " + e.getMessage());
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        stopRingtoneAndVibration();
    }

    @Override
    public void onBackPressed() {
        // Back tugmasi bilan yopish - decline kabi
        stopRingtoneAndVibration();
        super.onBackPressed();
    }
}