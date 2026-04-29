import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '@/components/Button';
import styles from './index.module.css';
import { formatDate } from '@/utils/helpers';
import { useAtomValue } from 'jotai';
import { languageAtom } from '@/store';

interface DatePickerProps {
  value?: Date;
  dateEnd?: Date; // новый параметр для конечной даты диапазона
  onChange?: (date: Date|undefined, dateEnd?: Date) => void; // изменён колбэк
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  rangeMode?: boolean; // режим выбора диапазона
}

export default function DatePicker({
  value,
  dateEnd,
  onChange,
  minDate,
  maxDate,
  placeholder = 'Выберите дату',
  disabled = false,
  className = '',
  rangeMode = false
}: DatePickerProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value || new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(value || null);
  const [selectedDateEnd, setSelectedDateEnd] = useState<Date | null>(dateEnd || null);
  const [selectingEnd, setSelectingEnd] = useState(false); // флаг выбора конечной даты
  const wrapperRef = useRef<HTMLDivElement>(null);
  const lang = useAtomValue(languageAtom);

  const months = [
    t('january'), t('february'), t('march'), t('april'),
    t('may'), t('june'), t('july'), t('august'),
    t('september'), t('october'), t('november'), t('december')
  ];

  const weekDays = [
    t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat'), t('sun')
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // сбрасываем режим выбора при закрытии
        setSelectingEnd(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (value) {
      setSelectedDate(value);
      setCurrentMonth(value);
    }
  }, [value]);

  useEffect(() => {
    if (dateEnd) {
      setSelectedDateEnd(dateEnd);
    }
  }, [dateEnd]);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const isDateInRange = (date: Date): boolean => {
    if (!rangeMode) return false;
    if (!selectedDate || !selectedDateEnd) return false;

    const start = new Date(selectedDate);
    const end = new Date(selectedDateEnd);
    return date >= start && date <= end;
  };

  const isDateRangeStart = (date: Date): boolean => {
    if (!rangeMode || !selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const isDateRangeEnd = (date: Date): boolean => {
    if (!rangeMode || !selectedDateEnd) return false;
    return date.toDateString() === selectedDateEnd.toDateString();
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);

    if (minDate && newDate < minDate) return;
    if (maxDate && newDate > maxDate) return;

    if (rangeMode) {
      if (!selectingEnd || !selectedDate) {
        // Начинаем новый диапазон или перевыбираем начало
        setSelectedDate(newDate);
        setSelectedDateEnd(null);
        setSelectingEnd(true);
        onChange?.(newDate, undefined);
      } else {
        // Выбираем конечную дату
        let start = selectedDate;
        let end = newDate;

        // Если конечная дата раньше начальной - меняем их местами
        if (end < start) {
          [start, end] = [end, start];
        }

        setSelectedDate(start);
        setSelectedDateEnd(end);
        setSelectingEnd(false);
        onChange?.(start, end);
        setIsOpen(false);
      }
    } else {
      setSelectedDate(newDate);
      onChange?.(newDate, undefined);
      setIsOpen(false);
    }
  };

  const isDateDisabled = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const getRangeDisplayText = (): string => {
    if (!rangeMode) {
      return selectedDate ? formatDate(selectedDate, lang, true) : placeholder;
    }

    if (selectedDate && selectedDateEnd) {
      return `${formatDate(selectedDate, lang, true)} - ${formatDate(selectedDateEnd, lang, true)}`;
    }

    if (selectedDate && !selectedDateEnd) {
      return `${formatDate(selectedDate, lang, true)} - ${t('selectEndDate') || '...'}`;
    }

    return placeholder;
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Пустые ячейки для дней предыдущего месяца
    for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) {
      days.push(<div key={`empty-${i}`} className={styles.emptyDay} />);
    }

    // Дни текущего месяца
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);

      const isSelected = !rangeMode && selectedDate &&
        selectedDate.getDate() === day &&
        selectedDate.getMonth() === currentMonth.getMonth() &&
        selectedDate.getFullYear() === currentMonth.getFullYear();

      const isToday = new Date().getDate() === day &&
        new Date().getMonth() === currentMonth.getMonth() &&
        new Date().getFullYear() === currentMonth.getFullYear();

      const isRangeStart = isDateRangeStart(currentDate);
      const isRangeEnd = isDateRangeEnd(currentDate);
      const isInRange = isDateInRange(currentDate);
      const isRangePreview = rangeMode && selectedDate && !selectedDateEnd &&
        !selectingEnd && currentDate > selectedDate;

      const disabled = isDateDisabled(day);

      days.push(
        <button
          key={day}
          className={`
            ${styles.day}
            ${isSelected ? styles.selectedDay : ''}
            ${isToday ? styles.today : ''}
            ${disabled ? styles.disabledDay : ''}
            ${rangeMode ? styles.rangeDay : ''}
            ${isRangeStart ? styles.rangeStart : ''}
            ${isRangeEnd ? styles.rangeEnd : ''}
            ${isInRange ? styles.rangeInRange : ''}
            ${isRangePreview ? styles.rangePreview : ''}
          `}
          onClick={() => handleDateSelect(day)}
          disabled={disabled}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const handleResetRange = () => {
    setSelectedDate(null);
    setSelectedDateEnd(null);
    setSelectingEnd(false);
    onChange?.(undefined, undefined);
  };

  return (
    <div ref={wrapperRef} className={`${styles.wrapper} ${className}`}>
      <div
        className={`${styles.input} ${disabled ? styles.disabled : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <Calendar size={18} className={styles.icon} />
        <span className={styles.value}>
          {getRangeDisplayText()}
        </span>
        {rangeMode && (selectedDate || selectedDateEnd) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleResetRange();
            }}
            className={styles.clearButton}
            aria-label="Очистить диапазон"
          >
            ×
          </button>
        )}
      </div>

      {isOpen && !disabled && (
        <div className={styles.dropdown}>
          <div className={styles.header}>
            <button
              onClick={handlePrevMonth}
              className={styles.monthNav}
            >
              <ChevronLeft size={18} />
            </button>
            <span className={styles.monthYear}>
              {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button
              onClick={handleNextMonth}
              className={styles.monthNav}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className={styles.weekDays}>
            {weekDays.map(day => (
              <div key={day} className={styles.weekDay}>{day}</div>
            ))}
          </div>

          <div className={styles.days}>
            {renderCalendar()}
          </div>

          <div className={styles.footer}>
            {rangeMode && selectingEnd && selectedDate && (
              <div className={styles.rangeHint}>
                {t('selectEndDateHint')}
              </div>
            )}
            <Button
              title={t('today')}
              onClick={() => {
                const today = new Date();
                setCurrentMonth(today);
                handleDateSelect(today.getDate());
              }}
              className={styles.todayButton}
              stroke
            />
            {rangeMode && (selectedDate || selectedDateEnd) && (
              <Button
                title={t('clear')}
                onClick={handleResetRange}
                className={styles.clearRangeButton}
                stroke
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}