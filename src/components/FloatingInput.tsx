import React from 'react';

interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label: string;
  containerClassName?: string;
  icon?: React.ReactNode;
  iconPosition?: 'start' | 'end';
  startElement?: React.ReactNode;
  endElement?: React.ReactNode;
  bgClass?: string;
  isTextArea?: boolean;
  error?: string | boolean;
}

export function FloatingInput({ 
  label, 
  type = 'text',
  className = '',
  containerClassName = '',
  icon,
  iconPosition = 'end',
  startElement,
  endElement,
  bgClass = 'bg-white',
  dir,
  isTextArea = false,
  error,
  children,
  ...props 
}: FloatingInputProps & { children?: React.ReactNode }) {
  
  const actualStartElement = startElement || (icon && iconPosition === 'start' ? icon : null);
  const actualEndElement = endElement || (icon && iconPosition === 'end' ? icon : null);

  const hasError = !!error;
  const containerBorder = hasError 
    ? 'border-red-400 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500' 
    : 'border-slate-200 focus-within:border-solar focus-within:ring-1 focus-within:ring-solar';

  const InputComponent = isTextArea ? 'textarea' : 'input';

  return (
    <div className={`relative w-full ${containerClassName}`}>
      <div className={`
        relative flex transition-all duration-200 ease-in-out
        ${isTextArea ? 'min-h-[120px] items-stretch' : 'h-14 items-center'} 
        ${bgClass} border ${containerBorder}
        rounded-xl shadow-sm ${isTextArea ? '' : 'overflow-hidden'}
      `}>
        {actualStartElement && (
          <div className={`flex items-center justify-center z-10 ${hasError ? 'text-red-400' : 'text-slate-400 focus-within:text-solar'} ${isTextArea ? 'pt-4 px-3' : 'h-full'} ${startElement ? '' : (dir === 'ltr' ? 'pl-4 pr-2' : 'pr-4 pl-2')}`}>
            {actualStartElement}
          </div>
        )}
        
        <div className={`relative flex-1 flex flex-col ${isTextArea ? 'justify-start' : 'justify-center'}`}>
          <InputComponent
            {...(props as any)}
            type={type}
            dir={dir}
            placeholder=" "
            className={`
              peer w-full bg-transparent outline-none 
              text-carbon font-semibold text-sm sm:text-base
              ${isTextArea ? 'resize-none pt-7 pb-3 px-4 min-h-[120px]' : 'h-full pt-5 pb-1'}
              ${!actualStartElement ? (dir === 'ltr' ? 'pl-4' : 'pr-4') : 'px-2'}
              ${!actualEndElement ? (dir === 'ltr' ? 'pr-4' : 'pl-4') : 'px-2'}
              ${className}
            `}
          />
          
          <label
            className={`
              absolute pointer-events-none transition-all duration-200 ease-in-out z-20
              ${!actualStartElement ? (dir === 'ltr' ? 'left-4' : 'right-4') : (dir === 'ltr' ? 'left-2' : 'right-2')}
              top-1.5 text-[10px] sm:text-xs font-bold ${hasError ? 'text-red-500' : 'text-slate-500 peer-focus:text-solar'}
              peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:font-medium peer-placeholder-shown:text-slate-400
              ${isTextArea ? 'peer-placeholder-shown:top-6' : ''}
            `}
          >
            {label}
          </label>
        </div>

        {actualEndElement && (
          <div className={`flex items-center justify-center h-full z-10 ${hasError ? 'text-red-400' : 'text-slate-400 focus-within:text-solar'} ${isTextArea ? 'pt-4' : ''} ${endElement ? '' : (dir === 'ltr' ? 'pr-4 pl-2' : 'pl-4 pr-2')}`}>
            {actualEndElement}
          </div>
        )}
        {children}
      </div>
      {typeof error === 'string' && (
        <p className="absolute -bottom-5 left-0 right-0 text-[10px] sm:text-xs text-red-500 font-medium px-2">
          {error}
        </p>
      )}
    </div>
  );
}

export default FloatingInput;
