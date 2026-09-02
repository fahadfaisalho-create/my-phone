'use client';

import { useEffect, useState } from 'react';
import { useLocale } from '@/lib/i18n';

export default function FileField({
  label,
  required,
  accept,
  file,
  onChange,
  previewAsImage,
}: {
  label: string;
  required?: boolean;
  accept: string;
  file: File | null;
  onChange: (file: File | null) => void;
  previewAsImage?: boolean;
}) {
  const { t } = useLocale();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (file && previewAsImage && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [file, previewAsImage]);

  return (
    <div className="filebox">
      <label>
        {label} {required ? t('fileField.required') : t('fileField.optional')}
      </label>
      <div className="filerow">
        {previewUrl && <img src={previewUrl} className="filepreview-img" alt={label} />}
        <label className="filebtn">
          {file ? t('fileField.changeFile') : t('fileField.chooseFile')}
          <input
            type="file"
            accept={accept}
            style={{ display: 'none' }}
            onChange={(e) => onChange(e.target.files?.[0] ?? null)}
          />
        </label>
        {file && !previewAsImage && <span className="filename">{file.name}</span>}
        {file && previewAsImage && !file.type.startsWith('image/') && (
          <span className="filename">{file.name}</span>
        )}
      </div>
    </div>
  );
}
