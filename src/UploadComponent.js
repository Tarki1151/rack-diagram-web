import React from 'react';

const UploadComponent = ({ setFile, uploadFile, disabled, errors }) => { // `disabled` prop'u eklendi
  return (
    <div className="upload-component">
      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={(e) => setFile(e.target.files[0])}
        disabled={disabled} // Yükleme sırasında input'u devre dışı bırak
      />
      <button onClick={uploadFile} disabled={disabled}> {/* Yükleme sırasında butonu devre dışı bırak */}
        Yükle ve İşle
      </button>
      {/* Hatalar artık MainApp'te daha merkezi bir şekilde gösteriliyor,
          bu nedenle buradaki `errors` prop'unu kaldırmayı düşünebilirsiniz
          veya sadece dosya seçimiyle ilgili basit hataları burada gösterebilirsiniz.
          Şimdilik MainApp'teki renderErrors daha kapsamlı.
      */}
      {/* {errors && <div style={{ color: 'red' }}>{JSON.stringify(errors)}</div>} */}
    </div>
  );
};

export default UploadComponent;