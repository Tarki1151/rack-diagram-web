import React from 'react';

const UploadComponent = ({ setFile, uploadFile, errors }) => {
  return (
    <>
      <a href="/templates/input_template.xlsx" download>Şablonu İndir</a>
      <input type="file" onChange={e => setFile(e.target.files[0])} />
      <button onClick={uploadFile}>Yükle ve İşle</button>
      
      {errors && (
        <div className="errors">
          <h2>Hatalar Tespit Edildi</h2>
          <pre>{JSON.stringify(errors, null, 2)}</pre>
          <p>Lütfen dosyayı düzeltip tekrar yükleyin.</p>
        </div>
      )}
    </>
  );
};

export default UploadComponent;