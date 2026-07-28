import { useRef, useState } from 'react';
import { TextInput, View } from 'react-native';

import { loginStyles as styles, OTP_LENGTH } from './login-styles';

export function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = useRef<(TextInput | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  function handleChange(text: string, index: number) {
    const newValue = value.split('');
    if (text.length > 1) {
      const pasted = text.replace(/[^0-9]/g, '').slice(0, OTP_LENGTH);
      onChange(pasted);
      refs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
      return;
    }
    newValue[index] = text;
    onChange(newValue.join(''));
    if (text && index < OTP_LENGTH - 1) {
      refs.current[index + 1]?.focus();
    }
  }

  function handleKeyPress(key: string, index: number) {
    if (key === 'Backspace' && !value[index] && index > 0) {
      const newValue = value.split('');
      newValue[index - 1] = '';
      onChange(newValue.join(''));
      refs.current[index - 1]?.focus();
    }
  }

  return (
    <View style={styles.otpRow}>
      {Array.from({ length: OTP_LENGTH }).map((_, i) => (
        <TextInput
          key={i}
          ref={(r) => { refs.current[i] = r; }}
          value={value[i] || ''}
          onChangeText={(t) => handleChange(t, i)}
          onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
          keyboardType="number-pad"
          maxLength={i === 0 ? OTP_LENGTH : 2}
          textContentType="oneTimeCode"
          autoComplete={i === 0 ? 'sms-otp' : 'off'}
          importantForAutofill={i === 0 ? 'yes' : 'no'}
          onFocus={() => setFocusedIndex(i)}
          onBlur={() => setFocusedIndex((f) => (f === i ? null : f))}
          style={[
            styles.otpBox,
            value[i] ? styles.otpBoxFilled : null,
            focusedIndex === i && !value[i] ? styles.otpBoxFocused : null,
          ]}
          selectTextOnFocus
        />
      ))}
    </View>
  );
}
