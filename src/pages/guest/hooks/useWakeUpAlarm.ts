// src/pages/guest/hooks/useWakeUpAlarm.ts
import { useState, useEffect, useCallback } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export interface WakeUpAlarm {
  id: number;
  time: string;          // 'HH:MM' (24h)
  date: string;          // 'YYYY-MM-DD'
  label?: string;
  enabled: boolean;
  repeat: 'once' | 'daily';
}

const STORAGE_KEY = 'safora_wake_up_alarms';

// ⭐⭐⭐ YANGI CHANNEL ID — eski sukut channel'ni chetlab o'tish uchun
const CHANNEL_ID = 'safora_wakeup_alarm_v3';

// ⭐⭐⭐ TOVUSH FAYLI — android/app/src/main/res/raw/alarm.wav
const ALARM_SOUND = 'alarm.wav';

// ─── Yordamchi: vaqt + sanadan Date ───
const buildAlarmDate = (date: string, time: string): Date => {
  const [hours, minutes] = time.split(':').map(Number);
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
};

export const useWakeUpAlarm = () => {
  const [alarms, setAlarms] = useState<WakeUpAlarm[]>([]);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'pending'>('pending');
  const [channelReady, setChannelReady] = useState(false);
  const isNative = Capacitor.isNativePlatform();

  // ─── Storage'dan yuklash ───
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setAlarms(parsed);
      }
    } catch (err) {
      console.warn('[useWakeUpAlarm] storage parse error:', err);
    }
  }, []);

  // ─── ⭐⭐⭐ NOTIFICATION CHANNEL — TOVUSH BILAN ───
  useEffect(() => {
    if (!isNative) {
      setChannelReady(true);
      return;
    }

    const setupChannel = async () => {
      try {
        await LocalNotifications.createChannel({
          id: CHANNEL_ID,
          name: 'Wake-up Alarms',
          description: 'Hotel guest wake-up call notifications',
          importance: 5,             // 5 = MAX
          visibility: 1,             // PUBLIC
          sound: ALARM_SOUND,        // ⭐⭐⭐ KRITIK — alarm.wav fayli (res/raw/alarm.wav)
          vibration: true,
          lights: true,
        });
        console.log('[useWakeUpAlarm] ✅ Channel created with sound:', ALARM_SOUND);
        setChannelReady(true);
      } catch (err) {
        console.warn('[useWakeUpAlarm] channel create error:', err);
        setChannelReady(true);
      }

      // Action types — Snooze va Dismiss tugmalari
      try {
        await LocalNotifications.registerActionTypes({
          types: [
            {
              id: 'WAKE_UP_ALARM',
              actions: [
                { id: 'snooze', title: '😴 5 daq. kechiktirish' },
                { id: 'dismiss', title: '✓ O\'chirish', destructive: true },
              ],
            },
          ],
        });
      } catch {}
    };

    setupChannel();
  }, [isNative]);

  // ─── Permission check on mount ───
  useEffect(() => {
    if (isNative) {
      LocalNotifications.checkPermissions()
        .then((result) => {
          setPermission(result.display === 'granted' ? 'granted' : 'denied');
        })
        .catch(() => setPermission('denied'));
    } else {
      if ('Notification' in window) {
        if (Notification.permission === 'granted') setPermission('granted');
        else if (Notification.permission === 'denied') setPermission('denied');
      }
    }
  }, [isNative]);

  const saveAlarms = useCallback((next: WakeUpAlarm[]) => {
    setAlarms(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (err) {
      console.warn('[useWakeUpAlarm] storage save error:', err);
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (isNative) {
      try {
        const result = await LocalNotifications.requestPermissions();
        const granted = result.display === 'granted';
        setPermission(granted ? 'granted' : 'denied');
        return granted;
      } catch (err) {
        console.error('[useWakeUpAlarm] permission error:', err);
        setPermission('denied');
        return false;
      }
    }

    if ('Notification' in window) {
      try {
        const result = await Notification.requestPermission();
        const granted = result === 'granted';
        setPermission(granted ? 'granted' : 'denied');
        return granted;
      } catch {
        return false;
      }
    }

    return false;
  }, [isNative]);

  // ─── ⭐⭐⭐ Test alarm — 5 sekunddan keyin chaladi (DEBUG) ───
  const testAlarm = useCallback(async () => {
    if (permission !== 'granted') {
      const ok = await requestPermission();
      if (!ok) return false;
    }

    if (!isNative) {
      try {
        const audio = new Audio('/alarm.mp3');
        audio.play();
      } catch {}
      return true;
    }

    try {
      const testTime = new Date(Date.now() + 5000); // 5 sekund keyin
      await LocalNotifications.schedule({
        notifications: [
          {
            id: 99999,
            title: '🔔 Test Alarm',
            body: 'Tovush ishlayaptimi?',
            schedule: { at: testTime, allowWhileIdle: true },
            channelId: CHANNEL_ID,
            sound: ALARM_SOUND,        // ⭐ Notification level (Android <8 uchun)
            ongoing: false,
            autoCancel: true,
          },
        ],
      });
      return true;
    } catch (err) {
      console.error('[useWakeUpAlarm] test error:', err);
      return false;
    }
  }, [isNative, permission, requestPermission]);

  // ─── Alarm rejalashtirish ───
  const scheduleAlarm = useCallback(
    async (
      time: string,
      date: string,
      label?: string,
      repeat: 'once' | 'daily' = 'once'
    ): Promise<{ success: boolean; alarm?: WakeUpAlarm; error?: string }> => {
      if (permission !== 'granted') {
        const ok = await requestPermission();
        if (!ok) {
          return {
            success: false,
            error: 'Bildirishnoma uchun ruxsat berilmagan.',
          };
        }
      }

      const alarmDate = buildAlarmDate(date, time);

      if (alarmDate.getTime() <= Date.now() + 30 * 1000) {
        return {
          success: false,
          error: 'Tanlangan vaqt o\'tib bo\'lgan.',
        };
      }

      const id = Math.floor(Date.now() / 1000) % 2147483647;

      if (isNative) {
        try {
          await LocalNotifications.schedule({
            notifications: [
              {
                id,
                title: '⏰ Wake-up Call!',
                body: label || 'Vaqt keldi! Yaxshi tongni!',
                schedule: {
                  at: alarmDate,
                  repeats: repeat === 'daily',
                  every: repeat === 'daily' ? 'day' : undefined,
                  allowWhileIdle: true,
                },
                channelId: CHANNEL_ID,
                sound: ALARM_SOUND,        // ⭐⭐⭐ Notification level sound
                ongoing: false,
                autoCancel: false,
                actionTypeId: 'WAKE_UP_ALARM',
                extra: { type: 'wake_up', label, time, date, repeat },
              },
            ],
          });
          console.log(
            `[useWakeUpAlarm] ⏰ Scheduled with sound: ${alarmDate.toLocaleString('uz-UZ')}`
          );
        } catch (err: any) {
          console.error('[useWakeUpAlarm] schedule error:', err);
          return {
            success: false,
            error: err?.message || 'Budilnik o\'rnatishda xato',
          };
        }
      } else {
        // BROWSER fallback
        const ms = alarmDate.getTime() - Date.now();
        if (ms > 0 && ms < 2147483647) {
          setTimeout(() => {
            if (Notification.permission === 'granted') {
              new Notification('⏰ Wake-up!', {
                body: label || 'Vaqt keldi!',
                requireInteraction: true,
                tag: `wake-up-${id}`,
              });
            }
            try {
              const audio = new Audio('/alarm.mp3');
              audio.loop = true;
              audio.play().catch(() => {});
            } catch {}
          }, ms);
        }
      }

      const alarm: WakeUpAlarm = { id, time, date, label, enabled: true, repeat };
      saveAlarms([...alarms, alarm]);
      return { success: true, alarm };
    },
    [alarms, isNative, permission, requestPermission, saveAlarms]
  );

  const cancelAlarm = useCallback(
    async (id: number) => {
      if (isNative) {
        try {
          await LocalNotifications.cancel({ notifications: [{ id }] });
        } catch {}
      }
      saveAlarms(alarms.filter((a) => a.id !== id));
    },
    [alarms, isNative, saveAlarms]
  );

  const cancelAllAlarms = useCallback(async () => {
    if (isNative && alarms.length > 0) {
      try {
        await LocalNotifications.cancel({
          notifications: alarms.map((a) => ({ id: a.id })),
        });
      } catch {}
    }
    saveAlarms([]);
  }, [alarms, isNative, saveAlarms]);

  return {
    alarms,
    permission,
    isNative,
    channelReady,
    requestPermission,
    scheduleAlarm,
    cancelAlarm,
    cancelAllAlarms,
    testAlarm,                  // ⭐ YANGI — test uchun
  };
};