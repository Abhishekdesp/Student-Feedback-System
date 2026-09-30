import { SystemSetting } from '../models/SystemSetting.js';

export class SettingService {
  static async getSetting(key: string) {
    const setting = await SystemSetting.findOne({ key });
    return setting ? setting.value : null;
  }

  static async setSetting(key: string, value: any) {
    const setting = await SystemSetting.findOneAndUpdate(
      { key },
      { value },
      { upsert: true, new: true }
    );
    return setting;
  }

  static async getAiSetting(): Promise<boolean> {
    const val = await SettingService.getSetting('use_external_ai');
    if (val === null || val === undefined) return true;
    return val === true || val === '1' || val === 'true';
  }

  static async setAiSetting(useExternalAi: boolean): Promise<boolean> {
    await SettingService.setSetting('use_external_ai', useExternalAi);
    return useExternalAi;
  }
}
