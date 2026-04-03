// utils/exportExcel.ts
import { ParticipantPlayoffType, ParticipantType } from '@/typings';
import i18n from './i18n';
import { writeFile } from '@tauri-apps/plugin-fs';
import { save } from '@tauri-apps/plugin-dialog';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

function getTitleForBook(index: number, data: ParticipantType[][][]|ParticipantPlayoffType[][][]) {
  switch(index) {
    case data.length-1:
      return i18n.t('finalAndThirdPlace')
    case data.length-2:
      return i18n.t('semifinal')
    default:
      return `1-${Math.pow(2, data.length - index)} ${i18n.t('final')}`
  }
}

export async function exportExcel(
  data: ParticipantType[][][]|ParticipantPlayoffType[][][],
  fileName = 'tournament.xlsx',
  isPoolEnd = false
) {
  try {
    const wb = XLSX.utils.book_new();

    /* заголовки */
    data.forEach((pair, i) => {
      const wsData: any[][] = [];
      wsData.push([isPoolEnd ? getTitleForBook(i, data) : `${i + 1} ${i18n.t('stage')}`]);
      wsData.push([
        i18n.t('name'),
        i18n.t('warnings'),
        i18n.t('protests'),
        i18n.t('score'),
        i18n.t('win'),
        i18n.t('doubleHits'),
        i18n.t('win'),
        i18n.t('score'),
        i18n.t('protests'),
        i18n.t('warnings'),
        i18n.t('name')
      ]);

      pair.forEach(([p1, p2]) => {
        wsData.push([
          p1?.name || '',
          p1?.warnings?.toString() || '0',
          p1?.protests?.toString() || '0',
          p1?.scores?.toString() || '0',
          p1?.wins?.toString() || '0',
          p1?.doubleHits?.toString() || '0',
          p2?.wins?.toString() || '0',
          p2?.scores?.toString() || '0',
          p2?.protests?.toString() || '0',
          p2?.warnings?.toString() || '0',
          p2?.name || ''
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, isPoolEnd ? getTitleForBook(i, data) : `${i + 1} ${i18n.t('stage')}`);
    });

    // Генерируем Excel файл
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

    // Диалог сохранения файла
    const filePath = await save({
      defaultPath: fileName,
      filters: [{
        name: 'Excel Files',
        extensions: ['xlsx']
      }]
    });

    if (!filePath) {
      // Пользователь отменил диалог
      return;
    }

    // Сохраняем файл
    await writeFile(filePath, new Uint8Array(wbout));

    // Уведомление об успешном сохранении
    toast.success(i18n.t("fileSave"));
  } catch (error) {
    toast.error(i18n.t("fileFail"));
  }
}