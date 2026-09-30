import { SettingService } from '../services/settingService.js';
export const getAiSetting = async (_req, res, next) => {
    try {
        const useExternalAi = await SettingService.getAiSetting();
        res.status(200).json({ success: true, useExternalAi });
    }
    catch (error) {
        next(error);
    }
};
export const updateAiSetting = async (req, res, next) => {
    try {
        const { useExternalAi } = req.body;
        const value = useExternalAi === true || useExternalAi === '1' || useExternalAi === 'true';
        await SettingService.setAiSetting(value);
        res.status(200).json({
            success: true,
            message: `AI Engine updated to ${value ? 'Google Gemini 1.5 Flash Cloud' : 'Offline Lexicon Engine'}`,
            useExternalAi: value,
        });
    }
    catch (error) {
        next(error);
    }
};
