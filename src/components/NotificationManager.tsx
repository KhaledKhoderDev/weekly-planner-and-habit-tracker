import { useEffect } from 'react';
import { UserStats, PrayerSlotId, CustomPrayerConfig } from '../types';
import { PRAYER_SLOTS } from '../utils/constants';

interface Props {
  stats: UserStats;
  prayerConfigs: Record<PrayerSlotId, CustomPrayerConfig>;
}

export const NotificationManager: React.FC<Props> = ({ stats, prayerConfigs }) => {
  useEffect(() => {
    if (!stats.notifications?.enabled) return;

    if (Notification.permission !== 'granted') {
      Notification.requestPermission();
    }

    const checkNotifications = () => {
      const now = new Date();
      const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      PRAYER_SLOTS.forEach(slot => {
        const config = prayerConfigs[slot.id];
        if (!config || config.enabled === false) return;

        const [hours, minutes] = config.time.split(':').map(Number);
        const prayerDate = new Date();
        prayerDate.setHours(hours, minutes, 0, 0);

        const reminderMinutes = stats.notifications?.reminderMinutes || 5;
        const reminderTime = new Date(prayerDate.getTime() - reminderMinutes * 60000);
        
        const reminderTimeStr = `${String(reminderTime.getHours()).padStart(2, '0')}:${String(reminderTime.getMinutes()).padStart(2, '0')}`;

        if (nowTime === reminderTimeStr) {
          if (Notification.permission === 'granted') {
            new Notification(`موعد الصلاة اقترب: ${slot.ar}`, {
              body: `بقي ${reminderMinutes} دقائق على ${slot.ar}.`,
            });
          }
        }
      });
    };

    const interval = setInterval(checkNotifications, 60000);
    return () => clearInterval(interval);
  }, [stats.notifications, prayerConfigs]);

  return null;
};
