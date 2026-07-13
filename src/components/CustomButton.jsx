import React from "react";

const CUSTOM_BUTTON_CSS = `
.wrapper{
  display: inline-block;
}

.btn-custom{
  position: relative;
  padding: 8px 20px;
  font-size: 14px;
  border: 2px solid #0d6efd;
  color: #0d6efd;
  background: transparent;
  overflow: hidden;
  transition: all 0.3s;
}

.btn-custom span{
  position: relative;
  z-index: 2;
}

.btn-custom::after{
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  width: 0;
  height: 100%;
  background: #0d6efd;
  transition: 0.3s;
}

.btn-custom:hover{
  color: #fff;
}

.btn-custom:hover::after{
  width: 100%;
}

.btn-custom:disabled,
.btn-custom[disabled]{
  opacity: 0.65;
  cursor: not-allowed;
}

.btn-custom:disabled::after,
.btn-custom[disabled]::after{
  display: none;
}
`;

let stylesInjected = false;

function ensureStyles() {
  if (stylesInjected) {
    return;
  }

  stylesInjected = true;

  if (typeof document === "undefined") {
    return;
  }

  const existingStyle =
    document.getElementById(
      "lms-custom-button-styles"
    );

  if (existingStyle) {
    return;
  }

  const style =
    document.createElement("style");

  style.id =
    "lms-custom-button-styles";

  style.textContent =
    CUSTOM_BUTTON_CSS;

  document.head.appendChild(style);
}

export default function CustomButton(props) {
  ensureStyles();

  const text = props.text;
  const onClick = props.onClick;
  const disabled = props.disabled;

  let type = "button";

  if (props.type) {
    type = props.type;
  }

  function handleClick(event) {
    if (disabled) {
      event.preventDefault();
      return;
    }

    if (onClick) {
      event.preventDefault();
      onClick(event);
      return;
    }

    if (type !== "submit") {
      event.preventDefault();
    }
  }

  return (
    <div className="wrapper">
      <button
        type={type}
        className="btn-custom"
        onClick={handleClick}
        disabled={disabled}
      >
        <span>{text}</span>
      </button>
    </div>
  );
}