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
  onChange?: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function DatePicker({
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = 'Выберите дату',
  disabled = false,
  className = ''
}: DatePickerProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value || new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(value || null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const lang = useAtomValue(languageAtom)

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

  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);

    if (minDate && newDate < minDate) return;
    if (maxDate && newDate > maxDate) return;

    setSelectedDate(newDate);
    onChange?.(newDate);
    setIsOpen(false);
  };

  const isDateDisabled = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
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
      const isSelected = selectedDate &&
        selectedDate.getDate() === day &&
        selectedDate.getMonth() === currentMonth.getMonth() &&
        selectedDate.getFullYear() === currentMonth.getFullYear();

      const isToday = new Date().getDate() === day &&
        new Date().getMonth() === currentMonth.getMonth() &&
        new Date().getFullYear() === currentMonth.getFullYear();

      const disabled = isDateDisabled(day);

      days.push(
        <button
          key={day}
          className={`
            ${styles.day}
            ${isSelected ? styles.selectedDay : ''}
            ${isToday ? styles.today : ''}
            ${disabled ? styles.disabledDay : ''}
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

  return (
    <div ref={wrapperRef} className={`${styles.wrapper} ${className}`}>
      <div
        className={`${styles.input} ${disabled ? styles.disabled : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <Calendar size={18} className={styles.icon} />
        <span className={styles.value}>
          {selectedDate ? formatDate(selectedDate, lang, true) : placeholder}
        </span>
      </div>

      {isOpen && !disabled && (
        <div className={styles.dropdown}>
          <div className={styles.header}>
            <button
              onClick={handlePrevMonth}
              className={styles.monthNav}
              aria-label="Предыдущий месяц"
            >
              <ChevronLeft size={18} />
            </button>
            <span className={styles.monthYear}>
              {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button
              onClick={handleNextMonth}
              className={styles.monthNav}
              aria-label="Следующий месяц"
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
            <Button
              title={t('today')}
              onClick={() => {
                const today = new Date();
                setCurrentMonth(today);
                handleDateSelect(today.getDate());
              }}
              className={styles.todayButton}
              stroke
            >
              {t('today')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}