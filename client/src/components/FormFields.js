import React from 'react';

// 数値入力フィールドコンポーネント
export const NumberField = ({ id, name, value, onChange, label, placeholder, min, max, style = {} }) => {
  return (
    <div style={{ textAlign: 'left' }}>
      <label htmlFor={id} style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
        {label}
      </label>
      <input
        type="number"
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        min={min}
        max={max}
        style={{
          width: '100%',
          padding: '8px',
          borderRadius: '4px',
          border: '1px solid #ccc',
          fontSize: '16px',
          ...style
        }}
      />
    </div>
  );
};

// セレクトボックスコンポーネント
export const SelectField = ({ id, name, value, onChange, label, options, style = {} }) => {
  return (
    <div style={{ textAlign: 'left' }}>
      <label htmlFor={id} style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
        {label}
      </label>
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        style={{
          width: '100%',
          padding: '8px',
          borderRadius: '4px',
          border: '1px solid #ccc',
          fontSize: '16px',
          ...style
        }}
      >
        <option value="">選択してください</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

// テキストエリアコンポーネント
export const TextAreaField = ({ id, name, value, onChange, label, placeholder, rows = 4, style = {} }) => {
  return (
    <div style={{ textAlign: 'left', width: '100%' }}>
      <label htmlFor={id} style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
        {label}
      </label>
      <textarea
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        style={{
          width: '100%',
          minWidth: '100%',
          maxWidth: '100%',
          padding: '12px',
          borderRadius: '4px',
          border: '1px solid #ccc',
          fontSize: '16px',
          resize: 'vertical',
          boxSizing: 'border-box',
          ...style
        }}
      />
    </div>
  );
};

// テキスト入力フィールドコンポーネント
export const TextField = ({ id, name, value, onChange, label, placeholder, style = {} }) => {
  return (
    <div style={{ textAlign: 'left' }}>
      <label htmlFor={id} style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
        {label}
      </label>
      <input
        type="text"
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '8px',
          borderRadius: '4px',
          border: '1px solid #ccc',
          fontSize: '16px',
          ...style
        }}
      />
    </div>
  );
};
