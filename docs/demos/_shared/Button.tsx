import React from 'react';

export function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { style, ...rest } = props;
  return (
    <button
      {...rest}
      style={{
        padding: '8px 16px',
        marginRight: 8,
        border: '1px solid #888',
        borderRadius: 4,
        background: '#fff',
        cursor: 'pointer',
        ...style,
      }}
    />
  );
}
