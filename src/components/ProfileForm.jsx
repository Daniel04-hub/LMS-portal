import React from "react";
import CustomButton from "./CustomButton";
import FormInput from "./FormInput";
import AlertMessage from "./AlertMessage";

export default function ProfileForm({
  title,
  message,
  messageType = "success",
  fields = [],
  onSubmit,
  buttonText = "Update Profile",
}) {
  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          <div className="card p-3 shadow-sm">
            <h1 className="h4 mb-3">{title}</h1>

            <AlertMessage message={message} type={messageType} />

            <form onSubmit={onSubmit}>
              {fields.map((field) => (
                <FormInput
                  key={field.name}
                  label={field.label}
                  type={field.type}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={field.placeholder}
                  name={field.name}
                  required={field.required}
                />
              ))}

              <CustomButton text={buttonText} onClick={onSubmit} />
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
