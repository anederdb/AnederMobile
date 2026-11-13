import DateTimePicker from '@expo/ui/community/datetime-picker';
import { createElement, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

import { t } from '@/i18n/tr';
import { formatTrDateTime } from '@/lib/dates';
import { colors, radius, space, touch, type } from '@/theme';

type Props = {
  label: string;
  value: Date | null;
  onChange: (d: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
  /** 'date' hides the time step (e.g. date of birth). Default: date and time. */
  mode?: 'datetime' | 'date';
};

/** A sensible starting point for the pickers: the next full hour. */
function nextHour(): Date {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return d;
}

const toLocalInput = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

const toLocalDate = (d: Date) => toLocalInput(d).slice(0, 10);

/** Date + time picker: calendar and clock dialogs on Android, inline calendar and wheel on iOS, native input on web. */
export function DateTimeField({ label, value, onChange, minimumDate, maximumDate, mode = 'datetime' }: Props) {
  const dateOnly = mode === 'date';
  const [open, setOpen] = useState(false);
  const [androidStep, setAndroidStep] = useState<'date' | 'time' | null>(null);
  const [draft, setDraft] = useState<Date>(value ?? (dateOnly ? new Date(1990, 0, 1) : nextHour()));
  const current = value ?? draft;

  if (Platform.OS === 'web') {
    const fmt = dateOnly ? toLocalDate : toLocalInput;
    return (
      <View style={{ gap: space.xs }}>
        <Text style={type.label}>{label}</Text>
        {createElement('input', {
          type: dateOnly ? 'date' : 'datetime-local',
          'aria-label': label,
          value: value ? fmt(value) : '',
          min: minimumDate ? fmt(minimumDate) : undefined,
          max: maximumDate ? fmt(maximumDate) : undefined,
          onChange: (e: { target: { value: string } }) => {
            // 'YYYY-MM-DD' alone would be read as UTC; build the local date instead.
            const [y, m, day] = e.target.value.split('-').map(Number);
            const d = dateOnly ? new Date(y, (m ?? 1) - 1, day ?? 1) : new Date(e.target.value);
            if (!Number.isNaN(d.getTime()) && e.target.value) onChange(d);
          },
          style: { minHeight: touch.minHeight, padding: 12, fontSize: 16, borderRadius: radius.md, border: `1px solid ${colors.border}` },
        })}
      </View>
    );
  }

  const field = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        if (Platform.OS === 'android') {
          setDraft(current);
          setAndroidStep('date');
        } else {
          if (!value) onChange(current);
          setOpen((o) => !o);
        }
      }}
      style={{
        minHeight: touch.minHeight,
        justifyContent: 'center',
        paddingHorizontal: space.md,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
      }}>
      <Text style={value ? type.body : [type.body, { color: colors.placeholder }]}>
        {value ? (dateOnly ? formatTrDateTime(value.toISOString()).slice(0, 10) : formatTrDateTime(value.toISOString())) : dateOnly ? t.auth.pickDate : t.admin.pickDateTime}
      </Text>
    </Pressable>
  );

  return (
    <View style={{ gap: space.xs }}>
      <Text style={type.label}>{label}</Text>
      {field}
      {Platform.OS === 'ios' && open ? (
        <View style={{ gap: space.sm }}>
          <DateTimePicker
            mode="date"
            display="inline"
            locale="tr_TR"
            value={current}
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            accentColor={colors.primary}
            onValueChange={(_e, d) => onChange(dateOnly ? d : merge(d, current))}
          />
          {dateOnly ? null : (
            <DateTimePicker
              mode="time"
              display="spinner"
              locale="tr_TR"
              value={current}
              accentColor={colors.primary}
              onValueChange={(_e, d) => onChange(merge(current, d))}
            />
          )}
        </View>
      ) : null}
      {Platform.OS === 'android' && androidStep === 'date' ? (
        <DateTimePicker
          mode="date"
          presentation="dialog"
          value={draft}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onValueChange={(_e, d) => {
            setDraft(d);
            if (dateOnly) {
              setAndroidStep(null);
              onChange(d);
            } else {
              setAndroidStep('time');
            }
          }}
          onDismiss={() => setAndroidStep(null)}
        />
      ) : null}
      {Platform.OS === 'android' && androidStep === 'time' ? (
        <DateTimePicker
          mode="time"
          presentation="dialog"
          is24Hour
          value={draft}
          onValueChange={(_e, d) => {
            setAndroidStep(null);
            onChange(merge(draft, d));
          }}
          onDismiss={() => setAndroidStep(null)}
        />
      ) : null}
    </View>
  );
}

/** Date parts from `day`, time parts from `time`. */
function merge(day: Date, time: Date): Date {
  const d = new Date(day);
  d.setHours(time.getHours(), time.getMinutes(), 0, 0);
  return d;
}
