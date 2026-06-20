import React from 'react';
import { VoiceButton } from './VoiceButton';

interface VoiceInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export function VoiceInput({ value, onChange, className, placeholder }: VoiceInputProps) {
  return (
    <div className="relative">
      <textarea
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={className}
        placeholder={placeholder}
      />
      <div className="absolute bottom-3 left-3">
        <VoiceButton onTranscript={(transcript) => onChange(value + ' ' + transcript)} />
      </div>
    </div>
  );
}
