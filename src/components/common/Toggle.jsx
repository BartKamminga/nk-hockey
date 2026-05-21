import React from 'react'

export default function Toggle({ checked, onChange, label, hint }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', cursor: 'pointer', fontSize: 13 }}
      onClick={onChange}>
      <span style={{ width: 32, height: 18, borderRadius: 9, background: checked ? '#3b82f6' : '#ccc', position: 'relative', display: 'inline-block', transition: 'background .2s', flexShrink: 0 }}>
        <span style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: checked ? 16 : 2, transition: 'left .2s' }} />
      </span>
      <span>{label}</span>
      {hint && <span style={{ fontSize: 11, color: '#888', marginLeft: 'auto' }}>{hint}</span>}
    </label>
  )
}
