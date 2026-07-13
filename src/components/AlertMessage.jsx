import React from "react";

export default function AlertMessage(props) {
  let message = "";

  if (props.message) {
    message = props.message;
  }

  let type = "info";

  if (props.type) {
    type = props.type;
  }

  let className = "";

  if (props.className) {
    className = props.className;
  }

  if (message === "") {
    return null;
  }

  let classes = "alert";

  classes = classes + " alert-" + type;

  if (className !== "") {
    classes = classes + " " + className;
  }

  return (
    <div className={classes} role="alert">
      {message}
    </div>
  );
}