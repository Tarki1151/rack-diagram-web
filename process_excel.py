import json
import pandas as pd
import sys

def validate_excel(df):
    required_columns = ['No', 'Owner', 'BrandModel', 'Serial', 'Rack', 'U']
    errors = []
    
    missing_cols = [col for col in required_columns if col not in df.columns]
    if missing_cols:
        errors.append(f"Eksik sütunlar: {missing_cols}")
    
    for index, row in df.iterrows():
        if not pd.isna(row['Rack']) and not any(c.isdigit() for c in str(row['Rack'])):
            errors.append(f"Satır {index+2}: Rack sayısal bir değer içermeli")
        try:
            float(row['U'])
        except (ValueError, TypeError):
            if str(row['U']).upper() != 'BLADE':
                errors.append(f"Satır {index+2}: U sayısal veya 'BLADE' olmalı")
    
    return errors

def process_file(file_path):
    xl = pd.ExcelFile(file_path)
    cabinets = {}
    all_errors = {}
    
    for sheet in xl.sheet_names:
        df = pd.read_excel(file_path, sheet_name=sheet, header=0)
        # Boş satırları filtrele
        df = df.dropna(how='all')  # Tüm sütunları NaN olan satırları çıkar
        if df.empty:
            continue  # Boş sayfa ise atla
        errors = validate_excel(df)
        if errors:
            all_errors[sheet] = errors
        else:
            # NaN değerlerini string'e çevir (örneğin, boş string)
            df = df.fillna('')  # NaN'ları boş string ile değiştir
            cabinets[sheet] = df.to_dict('records')
    
    if all_errors and not cabinets:
        return {'errors': all_errors}
    return cabinets

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'Dosya yolu belirtilmedi'}))
    else:
        file_path = sys.argv[1]
        result = process_file(file_path)
        print(json.dumps(result))