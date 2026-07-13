import React from "react";

export default function FormInput({
  label = "",
  type = "text",
  value = "",
  onChange,
  placeholder = "",
  name = "",
  required = false,
  readOnly = false,
  disabled = false,
}) {
  return (
    <div className="mb-3">
      <label className="form-label">{label}</label>
      <input
        type={type}
        className="form-control"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        name={name}
        required={required}
        readOnly={readOnly}
        disabled={disabled}
      />
    </div>
  );
}
