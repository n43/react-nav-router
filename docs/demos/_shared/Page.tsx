import React from 'react';

export function Page({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div style={{ padding: 24, height: '100%', boxSizing: 'border-box' }}>
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      {children}
    </div>
  );
}
