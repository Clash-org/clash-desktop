import { useEffect, useState } from 'react';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { getVersion } from '@tauri-apps/api/app';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

interface UpdateInfo {
  available: boolean;
  version?: string;
  date?: string;
  body?: string;
  downloading: boolean;
  downloaded: number;
  totalSize?: number;
  error?: string;
}

export function useUpdater() {
  const { t } = useTranslation()
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>({
    available: false,
    downloading: false,
    downloaded: 0,
  });
  const [currentVersion, setCurrentVersion] = useState<string>('');

  // Получаем текущую версию приложения
  useEffect(() => {
    getVersion().then(setCurrentVersion);
  }, []);

  // Проверка обновлений
  const checkForUpdates = async (showNotification = true) => {
    try {
      const update = await check();

      if (update) {
        setUpdateInfo(prev => ({
          ...prev,
          available: true,
          version: update.version,
          date: update.date,
          body: update.body,
        }));

        if (showNotification) {
          toast.success(t("newVersion") + `: ${update.version}`)
        }
      }

      return update;
    } catch (error) {
      toast.error(String(error))
      setUpdateInfo(prev => ({
        ...prev,
        error: String(error),
      }));
      return null;
    }
  };

  // Загрузка и установка обновления
  const downloadAndInstall = async () => {
    const update = await check();

    if (!update) {
      return;
    }

    setUpdateInfo(prev => ({
      ...prev,
      downloading: true,
      downloaded: 0,
    }));

    try {
      let contentLength = 0;

      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case 'Started':
            contentLength = Number(event.data.contentLength);
            setUpdateInfo(prev => ({
              ...prev,
              totalSize: contentLength,
            }));
            break;
          case 'Progress':
            setUpdateInfo(prev => ({
              ...prev,
              downloaded: prev.downloaded + event.data.chunkLength,
            }));
            break;
          case 'Finished':
            setUpdateInfo(prev => ({
              ...prev,
              downloading: false,
            }));
            break;
        }
      });

      // Перезапускаем приложение после установки
      await relaunch();
    } catch (error) {
      toast.error(String(error));
      setUpdateInfo(prev => ({
        ...prev,
        downloading: false,
        error: String(error),
      }));
    }
  };

  return {
    updateInfo,
    currentVersion,
    checkForUpdates,
    downloadAndInstall,
  };
}