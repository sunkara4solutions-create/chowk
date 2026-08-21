import React, { useRef, useEffect } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { COLORS } from '../lib/config';

interface Props {
  value: string;
  onChange: (val: string) => void;
  length?: number;
}

export default function OTPInput({ value, onChange, length = 6 }: Props) {
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const digits = value.split('').slice(0, length);
  while (digits.length < length) digits.push('');

  return (
    <TouchableOpacity activeOpacity={1} onPress={() => inputRef.current?.focus()} style={styles.wrapper}>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, length))}
        keyboardType="number-pad"
        maxLength={length}
        style={styles.hidden}
        caretHidden
      />
      <View style={styles.row}>
        {digits.map((d, i) => (
          <View
            key={i}
            style={[
              styles.cell,
              value.length === i && styles.cellActive,
              d !== '' && styles.cellFilled,
            ]}
          >
            <Text style={styles.digit}>{d || ''}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignSelf: 'stretch' },
  hidden: { position: 'absolute', opacity: 0, width: 0, height: 0 },
  row: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  cell: {
    width: 46,
    height: 56,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellActive: { borderColor: COLORS.primary, borderWidth: 2 },
  cellFilled: { borderColor: COLORS.secondary },
  digit: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary },
});
