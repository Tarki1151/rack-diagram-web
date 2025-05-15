import functions_framework
from flask import request, jsonify
import os
import tempfile

# process_excel.py dosyanızdaki fonksiyonu import edin
from process_excel import process_file

@functions_framework.http
def upload_and_process_excel(req):
    """
    HTTP Cloud Function to handle Excel file uploads and process them.
    """
    # CORS başlıkları - Firebase Hosting alan adınızla güncelleyin
    # Geliştirme sırasında '*' kullanabilirsiniz, ancak canlı ortamda spesifik alan adınızı belirtin.
    # Örnek: 'https://sizin-projeniz.web.app'
    headers = {
        'Access-Control-Allow-Origin': 'https://rackcizimweb.web.app',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '3600'
    }

    # Tarayıcıların gönderdiği preflight (OPTIONS) isteklerini işle
    if req.method == 'OPTIONS':
        return ('', 204, headers)

    if req.method == 'POST':
        if 'file' not in req.files:
            return (jsonify({"error": "Talepte 'file' kısmı bulunamadı"}), 400, headers)

        uploaded_file = req.files['file']

        if uploaded_file.filename == '':
            return (jsonify({"error": "Dosya seçilmedi"}), 400, headers)

        if uploaded_file:
            # Dosyayı güvenli bir şekilde geçici bir dosyaya kaydet
            fd, temp_local_filename = tempfile.mkstemp(suffix=".xlsx")
            try:
                uploaded_file.save(temp_local_filename)
                
                # process_excel.py'deki fonksiyonu çağır
                # process_file fonksiyonunun dosya yolu aldığını ve bir dictionary döndürdüğünü varsayıyoruz.
                result_data = process_file(temp_local_filename)
                
                # Hata kontrolü: process_excel.py'nin döndürdüğü yapıya göre
                if isinstance(result_data, dict) and 'errors' in result_data and result_data['errors']:
                    # Eğer sadece hatalar varsa veya hatalarla birlikte kabinler de varsa
                    # Ön yüzün beklediği yapıya göre uygun bir yanıt oluşturun.
                    # Örneğin, hatalar varsa 400 Bad Request ile döndürebilirsiniz.
                    if not any(val for key, val in result_data.items() if key != 'errors'): # Sadece error varsa
                         return (jsonify(result_data), 400, headers)
                    # Hem error hem data varsa veya sadece data varsa (hata yoksa)
                    return (jsonify(result_data), 200, headers)

                return (jsonify(result_data), 200, headers)

            except Exception as e:
                # Genel bir hata durumunda
                error_message = f"Dosya işlenirken sunucu hatası oluştu: {str(e)}"
                # Geliştirme sırasında daha detaylı hata loglaması yapabilirsiniz
                # import traceback
                # error_message += "\n" + traceback.format_exc()
                return (jsonify({"error": error_message, "type": "processing_error"}), 500, headers)
            finally:
                # Geçici dosyayı sil (dosya tanımlayıcısını kapatmayı unutmayın)
                os.close(fd)
                if os.path.exists(temp_local_filename):
                    os.remove(temp_local_filename)
        else:
            return (jsonify({"error": "Yüklenen dosya geçersiz"}), 400, headers)

    return (jsonify({"error": "Yalnızca POST ve OPTIONS istekleri kabul edilir"}), 405, headers)