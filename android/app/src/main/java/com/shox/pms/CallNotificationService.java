package com.shox.pms;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.util.Map;

public class CallNotificationService extends FirebaseMessagingService {
    private static final String TAG = "CallService";
    public static final String CHANNEL_ID = "safora_calls";
    private static final int NOTIFICATION_ID = 1001;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    @Override
    public void onNewToken(String token) {
        Log.d(TAG, "Yangi FCM token: " + token);
    }

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        Log.d(TAG, "FCM xabar keldi");

        Map<String, String> data = remoteMessage.getData();
        if (data.isEmpty()) {
            Log.w(TAG, "Bosh data");
            return;
        }

        String type = data.get("type");
        Log.d(TAG, "Type: " + type);

        if ("incoming_call".equals(type)) {
            String callId = data.get("callId");
            String callerName = data.get("callerName");
            String hotelSlug = data.get("hotelSlug");
            String roomNumber = data.get("roomNumber");
            String offerSdp = data.get("offerSdp");

            Log.d(TAG, "Incoming call from: " + callerName);

            // ⭐ IncomingCallActivity uchun Intent
            Intent fullScreenIntent = new Intent(this, IncomingCallActivity.class);
            fullScreenIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            fullScreenIntent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
            fullScreenIntent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
            fullScreenIntent.putExtra("callId", callId);
            fullScreenIntent.putExtra("callerName", callerName != null ? callerName : "Hotel");
            fullScreenIntent.putExtra("hotelSlug", hotelSlug);
            fullScreenIntent.putExtra("roomNumber", roomNumber);
            fullScreenIntent.putExtra("offerSdp", offerSdp);

            // ⭐ FullScreen PendingIntent (lock screen UI uchun)
            PendingIntent fullScreenPendingIntent = PendingIntent.getActivity(
                this,
                0,
                fullScreenIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            // ⭐ Notification yaratish (full-screen intent bilan)
            NotificationCompat.Builder notificationBuilder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.sym_call_incoming)
                .setContentTitle("📞 Kelayotgan qo'ng'iroq")
                .setContentText(callerName != null ? callerName + " sizga qo'ng'iroq qilyapti" : "Qo'ng'iroq")
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_CALL)  // ⭐ MUHIM - call category
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)  // ⭐ Lock screen'da ko'rinadi
                .setAutoCancel(true)
                .setOngoing(true)  // O'chirilmaydigan
                .setFullScreenIntent(fullScreenPendingIntent, true)  // ⭐ ENG MUHIM - full screen lock
                .setContentIntent(fullScreenPendingIntent);

            // ⭐ Notification chiqarish
            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            if (notificationManager != null) {
                notificationManager.notify(NOTIFICATION_ID, notificationBuilder.build());
            }

            // ⭐ Va to'g'ridan-to'g'ri Activity ham chaqiramiz (qo'shimcha)
            try {
                startActivity(fullScreenIntent);
            } catch (Exception e) {
                Log.e(TAG, "startActivity xato (ehtimol background): " + e.getMessage());
                // FullScreenIntent baribir ishlaydi
            }
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Uri ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                .build();

            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Incoming Calls",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Kelayotgan qo'ng'iroqlar");
            channel.enableLights(true);
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[]{0, 1000, 500, 1000, 500, 1000});
            channel.setSound(ringtoneUri, audioAttributes);
            channel.setLockscreenVisibility(NotificationCompat.VISIBILITY_PUBLIC);
            channel.setBypassDnd(true);  // ⭐ Do Not Disturb chetlab o'tish

            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }
}