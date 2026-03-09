// components/ImageUploader/index.tsx
import { useState, useRef, useEffect } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { readFile } from '@tauri-apps/plugin-fs';
import { Trash2, Image as ImageIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import styles from './index.module.css';
import toast from 'react-hot-toast';

interface ImageUploaderProps {
  value?: string | null;
  setValue?: (formData: FormData) => void;
  onChange?: (base64: string | null) => void;
  setFileName?: (name: string | null) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  maxSize?: number; // в байтах, по умолчанию 5MB
  aspectRatio?: number; // например 16/9, 4/3, 1/1
}

export default function ImageUploader({
  value,
  setValue,
  onChange,
  setFileName,
  className = '',
  placeholder,
  disabled = false,
  maxSize = 5 * 1024 * 1024, // 5MB по умолчанию
  aspectRatio
}: ImageUploaderProps) {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const defaultPlaceholder = t('imageUploaderPlaceholder');
  const maxSizeMB = maxSize / 1024 / 1024;

  useEffect(() => {
    setPreviewUrl(value || null);
  }, [value]);

  // Обработка перетаскивания
  useEffect(() => {
    const dropZone = dropZoneRef.current;
    if (!dropZone || disabled) return;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;

      await handleFile(files[0]);
    };

    dropZone.addEventListener('dragenter', handleDragEnter);
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);

    return () => {
      dropZone.removeEventListener('dragenter', handleDragEnter);
      dropZone.removeEventListener('dragover', handleDragOver);
      dropZone.removeEventListener('dragleave', handleDragLeave);
      dropZone.removeEventListener('drop', handleDrop);
    };
  }, [disabled]);

  const handleFile = async (file: File) => {
    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      toast.error(t('imageUploaderErrorImageOnly'));
      return;
    }

    // Проверка размера
    if (file.size > maxSize) {
      toast.error(t('imageUploaderErrorFileSize', { size: maxSizeMB }));
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        const formData = new FormData();
        formData.append('image', file);
        setValue?.(formData)
        setFileName?.(file.name.split("/")[file.name.split("/").length - 1])
        setPreviewUrl(base64);
        onChange?.(base64);
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error(t('imageUploaderErrorLoad'));
    }
  };

  const handleFileSelect = async () => {
    if (disabled) return;

    try {
      const selected = await open({
        multiple: false,
        filters: [{
          name: 'Images',
          extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif']
        }]
      });

      if (!selected) return;

      // В Tauri v2 open возвращает путь к файлу
      const filePath = Array.isArray(selected) ? selected[0] : selected;

      // Читаем файл через Tauri FS
      const fileData = await readFile(filePath);
      const fileName = filePath.split("/")[filePath.split("/").length - 1]
      const file = new File([fileData], fileName, { type: `image/${fileName.split(".")[1]}`  });
      setFileName?.(fileName)
      const formData = new FormData();
      formData.append('image', file);
      setValue?.(formData)
      // Конвертируем в base64
      const base64 = `data:image/${filePath.split('.').pop()};base64,${Buffer.from(fileData).toString('base64')}`;

      setPreviewUrl(base64);
      onChange?.(base64);
    } catch {
      toast.error(t('imageUploaderErrorSelect'));
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onChange?.(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`${styles.container} ${className}`}>
      {/* Основная зона загрузки */}
      <div
        ref={dropZoneRef}
        className={`
          ${styles.dropZone}
          ${isDragging ? styles.dragging : ''}
          ${previewUrl ? styles.hasImage : ''}
          ${disabled ? styles.disabled : ''}
        `}
        onClick={!previewUrl ? handleFileSelect : undefined}
      >
        {previewUrl ? (
          // Предпросмотр изображения
          <div className={styles.previewContainer} style={aspectRatio ? { aspectRatio: `${aspectRatio}` } : {}}>
            <img
              src={previewUrl}
              alt="Preview"
              className={styles.preview}
              onClick={(e) => e.stopPropagation()}
            />

            {/* Кнопки управления */}
            <div className={styles.controls}>
              <button
                className={`${styles.controlButton} ${styles.removeButton}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                title={t('imageUploaderRemove')}
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ) : (
          // Плейсхолдер
          <div className={styles.placeholder}>
            <ImageIcon size={48} className={styles.placeholderIcon} />
            <p className={styles.placeholderText}>{placeholder || defaultPlaceholder}</p>
            <p className={styles.placeholderHint}>
              {t('imageUploaderSupportedFormats', { size: maxSizeMB })}
            </p>
          </div>
        )}
      </div>

      {/* Скрытый input для file (на случай если понадобится) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleFile(e.target.files[0]);
          }
        }}
        style={{ display: 'none' }}
      />
    </div>
  );
}