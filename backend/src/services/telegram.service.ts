import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class TelegramService {
  private readonly botToken: string;
  private readonly chatId: string;

  constructor(private readonly configService: ConfigService) {
    this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN') || '';
    this.chatId = this.configService.get<string>('TELEGRAM_CHAT_ID') || '';
  }

  async sendMessage(message: string): Promise<void> {
    if (!this.botToken || !this.chatId) {
      console.warn('Telegram Bot Token or Chat ID not configured.');
      return;
    }

    const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
    try {
      await axios.post(url, {
        chat_id: this.chatId,
        text: message,
      });
      console.log('Telegram message sent successfully.');
    } catch (error) {
      console.error('Failed to send Telegram message:', error.message);
    }
  }
}
