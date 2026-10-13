import React from "react";
import { useRef, useState } from "react";

function ImageCapture({ image, setImage }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(image || "");

  function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be smaller than 5 MB.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;
      setPreview(result);
      setImage(result);
    };

    reader.readAsDataURL(file);
  }

  function removeImage() {
    setPreview("");
    setImage("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <div className="image-capture">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        onChange={handleFileChange}
        className="image-input"
      />

      <div className="image-buttons">
        <button
          type="button"
          className="secondary-button"
          onClick={() => inputRef.current?.click()}
        >
          📷 Take / Select Photograph
        </button>

        {preview && (
          <button
            type="button"
            className="danger-button"
            onClick={removeImage}
          >
            Remove Photograph
          </button>
        )}
      </div>

      {preview && (
        <div className="image-preview">
          <img src={preview} alt="Survey preview" />
        </div>
      )}

      {!preview && (
        <p className="help-text">
          JPG, PNG or WEBP. Maximum 5 MB.
        </p>
      )}
    </div>
  );
}

export default ImageCapture;
