#!/usr/bin/env python3
import os
import shutil

# Pages klasöründe silinecek klasörler
pages_to_remove = [
    'AIAgentTest',
    'AIAssistant', 
    'AllCharts',
    'Blog',
    'Charts',
    'Chat',
    'Contacts',
    'Crypto',
    'Dashboard-Blog',
    'Dashboard-crypto',
    'Dashboard-saas',
    'DashboardJob',
    'Ecommerce',
    'Email',
    'Forms',
    'Icons',
    'InvoiceBot',
    'Invoices',
    'JobPages',
    'Maps',
    'Projects',
    'Tables',
    'Tasks',
    'Ui'
]

base_path = '/Users/selcuk/Desktop/admin_pan/Admin/src/pages'

removed = []
not_found = []

for folder in pages_to_remove:
    folder_path = os.path.join(base_path, folder)
    if os.path.exists(folder_path):
        try:
            if os.path.isdir(folder_path):
                shutil.rmtree(folder_path)
                removed.append(folder)
                print(f"✅ Silindi: {folder}")
            else:
                os.remove(folder_path)
                removed.append(folder)
                print(f"✅ Silindi (dosya): {folder}")
        except Exception as e:
            print(f"❌ Silinemedi {folder}: {e}")
    else:
        not_found.append(folder)
        print(f"⚠️  Bulunamadı: {folder}")

print(f"\n📊 Özet:")
print(f"Silinen: {len(removed)}")
print(f"Bulunamayan: {len(not_found)}")
