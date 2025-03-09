import React from 'react';
import { Link } from 'react-router-dom';
import './WelcomePage.css';

const WelcomePage = () => {
  return (
    <div className="welcome-container">
      <img src="/logo.png" alt="Şirket Logosu" className="company-logo" />
      <div className="content-container">
        <h1>Rack Diagram Web’e Hoş Geldiniz!</h1>
        <p>Bu uygulama, sistem odanızdaki kabinleri kolayca çizmenize ve yönetmenize olanak tanır. İşte nasıl kullanacağınız:</p>
        
        <h2>Nasıl Kullanılır?</h2>
        <ol>
          <li>
            <strong>Şablon Excel’i İndirin:</strong> Aşağıdaki bağlantıya tıklayarak şablon Excel dosyasını indirin: 
            <a href="/templates/input_template.xlsx" download>Şablon Excel’i İndir</a>
          </li>
          <li>
            <strong>Excel’i Doldurun:</strong> Her kabin için bir sayfa oluşturun (sayfa ismi kabin adı olacak). Her ürün için:
            <ul>
              <li><strong>Rack:</strong> Ürünün başlangıç U pozisyonunu girin (örneğin, 1, 5, 10).</li>
              <li><strong>U:</strong> Ürünün kapladığı toplam U miktarını yazın (örneğin, 1, 2, 4).</li>
              <li><strong>BrandModel:</strong> Ürünün marka ve modelini girin (örneğin, “Dell Poweredge R740”).</li>
              <li><strong>Face:</strong> Ürünün yönünü belirtin (örneğin, “Ön” veya “Arka”).</li>
              <li><strong>Owner:</strong> Ürünün sahibini yazın (isteğe bağlı).</li>
              <li><strong>Serial:</strong> Ürün seri numarasını girin (isteğe bağlı).</li>
            </ul>
            <p><em>Not:</em> Boş bırakılan alanlar otomatik olarak “Bilinmeyen” olarak işlenir.</p>
          </li>
          <li>
            <strong>Dosyayı Yükleyin:</strong> Ana sayfada “Dosya Seç” ile Excel dosyanızı seçin ve “Yükle ve İşle” butonuna tıklayın.
          </li>
          <li>
            <strong>Kabinleri Düzenleyin:</strong> Kabinler ekranda göründükten sonra fareyle sürükleyerek yerlerini ayarlayabilirsiniz. Snap-to-grid seçenekleriyle hizalamayı kolaylaştırın.
          </li>
          <li>
            <strong>Çıktı Alın:</strong> Çiziminizi PNG, JPEG, SVG veya PDF formatında indirmek için ilgili butonlara tıklayın.
          </li>
        </ol>

        <h2>Önemli İpuçları</h2>
        <ul>
          <li>Excel’de her sayfa bir kabini temsil eder, sayfa adını kabin adı olarak kullanın (örneğin, “Kabin1”).</li>
          <li>Rack ve U kolonları zorunlu; diğerleri isteğe bağlıdır.</li>
          <li>Tooltip ile ürün detaylarını (Owner, Serial) görmek için fareyi ürünlerin üzerine getirin.</li>
        </ul>

        <Link to="/app">
          <button className="start-button">Uygulamaya Başla</button>
        </Link>
      </div>
    </div>
  );
};

export default WelcomePage;