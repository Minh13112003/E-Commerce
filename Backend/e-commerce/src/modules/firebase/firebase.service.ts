import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { App, initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private app: App | null = null;

  onModuleInit() {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) {
      this.logger.warn('FIREBASE_SERVICE_ACCOUNT not set — push notifications disabled');
      return;
    }
    try {
      const serviceAccount = JSON.parse(
        Buffer.from(raw, 'base64').toString('utf8'),
      ) as ServiceAccount;

      this.app = initializeApp({ credential: cert(serviceAccount) });
      this.logger.log('Firebase Admin initialized');
    } catch (err) {
      this.logger.error('Failed to initialize Firebase Admin', err);
    }
  }

  async sendPush(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    // Expo Push Token (format: ExponentPushToken[...])
    if (token.startsWith('ExponentPushToken') || token.startsWith('ExpoPushToken')) {
      await this.sendExpoNotification(token, title, body, data);
      return;
    }
    // FCM token (raw Firebase token)
    await this.sendFcmNotification(token, title, body, data);
  }

  private async sendExpoNotification(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    try {
      const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ to: token, title, body, data, sound: 'default', priority: 'high' }),
      });
      const json = await res.json() as { data?: { status: string; message?: string } };
      if (json.data?.status === 'error') {
        this.logger.warn(`Expo push error: ${json.data.message}`);
      }
    } catch (err) {
      this.logger.warn(`Expo push failed: ${err}`);
    }
  }

  private async sendFcmNotification(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    if (!this.app) return;
    try {
      await getMessaging(this.app).send({
        token,
        notification: { title, body },
        data,
        android: { priority: 'high' },
        apns: { payload: { aps: { sound: 'default', badge: 1 } } },
      });
    } catch (err) {
      this.logger.warn(`FCM send failed for token ${token.slice(0, 20)}…: ${err}`);
    }
  }
}
