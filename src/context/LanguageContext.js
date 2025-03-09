import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // localStorage'dan dil tercihini oku, yoksa varsayılan 'tr'
    return localStorage.getItem('language') || 'tr';
  });

  useEffect(() => {
    // Dil değiştiğinde localStorage'a kaydet
    localStorage.setItem('language', language);
  }, [language]);

  const translations = {
    tr: {
      welcome_title: "Rack Diagram Web’e Hoş Geldiniz!",
      welcome_description: "Bu uygulama, sistem odanızdaki kabinleri kolayca çizmenize ve yönetmenize olanak tanır. İşte nasıl kullanacağınız:",
      welcome_how_to_use: "Nasıl Kullanılır?",
      welcome_step_1: "Şablon Excel’i İndirin: Aşağıdaki bağlantıya tıklayarak şablon Excel dosyasını indirin:",
      welcome_download_template: "Şablon Excel’i İndir",
      welcome_step_2: "Excel’i Doldurun: Her kabin için bir sayfa oluşturun (sayfa ismi kabin adı olacak). Her ürün için:",
      welcome_step_2_rack: "Rack: Ürünün başlangıç U pozisyonunu girin (örneğin, 1, 5, 10).",
      welcome_step_2_u: "U: Ürünün kapladığı toplam U miktarını yazın (örneğin, 1, 2, 4).",
      welcome_step_2_brandmodel: "BrandModel: Ürünün marka ve modelini girin (örneğin, 'Dell Poweredge R740').",
      welcome_step_2_face: "Face: Ürünün yönünü belirtin (örneğin, 'Ön' veya 'Arka').",
      welcome_step_2_owner: "Owner: Ürünün sahibini yazın (isteğe bağlı).",
      welcome_step_2_serial: "Serial: Ürün seri numarasını girin (isteğe bağlı).",
      welcome_step_2_note: "Not: Boş bırakılan alanlar otomatik olarak 'Bilinmeyen' olarak işlenir.",
      welcome_step_3: "Dosyayı Yükleyin: Ana sayfada 'Dosya Seç' ile Excel dosyanızı seçin ve 'Yükle ve İşle' butonuna tıklayın.",
      welcome_step_4: "Kabinleri Düzenleyin: Kabinler ekranda göründükten sonra fareyle sürükleyerek yerlerini ayarlayabilirsiniz. Snap-to-grid seçenekleriyle hizalamayı kolaylaştırın.",
      welcome_step_5: "Çıktı Alın: Çiziminizi PNG, SVG veya PDF formatında indirmek için ilgili butonlara tıklayın.",
      welcome_tips: "Önemli İpuçları",
      welcome_tip_1: "Excel’de her sayfa bir kabini temsil eder, sayfa adını kabin adı olarak kullanın (örneğin, 'Kabin1').",
      welcome_tip_2: "Rack ve U kolonları zorunlu; diğerleri isteğe bağlıdır.",
      welcome_tip_3: "Tooltip ile ürün detaylarını (Owner, Serial) görmek için fareyi ürünlerin üzerine getirin.",
      welcome_start_button: "Uygulamaya Başla",
      app_title: "Rack Diagram Web",
      app_snap_to_grid: "Snap-to-Grid:",
      app_no_grid: "Izgara Yok",
      app_label_margin: "Etiket Boşluğu:",
      app_label_margin_0: "0px (Bitişik)",
      app_label_margin_5: "5px",
      app_label_margin_10: "10px",
      app_label_margin_15: "15px",
      app_label_alignment: "Etiket Hizalama:",
      app_left: "Sol",
      app_center: "Orta",
      app_right: "Sağ",
      app_zoom_in: "Yakınlaştır",
      app_zoom_out: "Uzaklaştır",
      app_help_button: "Nasıl Kullanılır?",
      app_export_png: "PNG İndir",
      app_export_svg: "SVG İndir",
      app_export_pdf: "PDF İndir",
      upload_button: "Yükle ve İşle"
    },
    en: {
      welcome_title: "Welcome to Rack Diagram Web!",
      welcome_description: "This application allows you to easily draw and manage cabinets in your server room. Here's how to use it:",
      welcome_how_to_use: "How to Use?",
      welcome_step_1: "Download the Template Excel: Click the link below to download the template Excel file:",
      welcome_download_template: "Download Template Excel",
      welcome_step_2: "Fill the Excel: Create a sheet for each cabinet (sheet name will be the cabinet name). For each product:",
      welcome_step_2_rack: "Rack: Enter the starting U position of the product (e.g., 1, 5, 10).",
      welcome_step_2_u: "U: Enter the total U amount occupied by the product (e.g., 1, 2, 4).",
      welcome_step_2_brandmodel: "BrandModel: Enter the brand and model of the product (e.g., 'Dell Poweredge R740').",
      welcome_step_2_face: "Face: Specify the direction of the product (e.g., 'Front' or 'Rear').",
      welcome_step_2_owner: "Owner: Enter the owner of the product (optional).",
      welcome_step_2_serial: "Serial: Enter the serial number of the product (optional).",
      welcome_step_2_note: "Note: Fields left blank will be automatically processed as 'Unknown'.",
      welcome_step_3: "Upload the File: On the main page, select your Excel file with 'Choose File' and click 'Upload and Process'.",
      welcome_step_4: "Arrange Cabinets: After the cabinets appear on the screen, drag them with the mouse to adjust their positions. Use snap-to-grid options to facilitate alignment.",
      welcome_step_5: "Export: Download your drawing in PNG, SVG, or PDF format by clicking the relevant buttons.",
      welcome_tips: "Important Tips",
      welcome_tip_1: "Each sheet in Excel represents a cabinet; use the sheet name as the cabinet name (e.g., 'Cabinet1').",
      welcome_tip_2: "Rack and U columns are mandatory; others are optional.",
      welcome_tip_3: "Hover over the products to see details (Owner, Serial) with a tooltip.",
      welcome_start_button: "Start Application",
      app_title: "Rack Diagram Web",
      app_snap_to_grid: "Snap-to-Grid:",
      app_no_grid: "No Grid",
      app_label_margin: "Label Margin:",
      app_label_margin_0: "0px (Adjacent)",
      app_label_margin_5: "5px",
      app_label_margin_10: "10px",
      app_label_margin_15: "15px",
      app_label_alignment: "Label Alignment:",
      app_left: "Left",
      app_center: "Center",
      app_right: "Right",
      app_zoom_in: "Zoom In",
      app_zoom_out: "Zoom Out",
      app_help_button: "How to Use?",
      app_export_png: "Download PNG",
      app_export_svg: "Download SVG",
      app_export_pdf: "Download PDF",
      upload_button: "Upload and Process"
    }
  };

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);