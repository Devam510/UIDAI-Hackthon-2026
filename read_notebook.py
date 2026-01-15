import json
import re

# Read the notebook
notebook_path = r'd:\Devam\Microsoft VS Code\Codes\UIDAI\UIDAI Hackthon\uidai_hackathon\notebooks\09_demand_forecasting.ipynb'

with open(notebook_path, 'r', encoding='utf-8') as f:
    nb = json.load(f)

# Find cells that contain Prophet forecast code
print("=== PROPHET FORECAST CELLS ===\n")

for i, cell in enumerate(nb['cells']):
    if cell['cell_type'] == 'code':
        source = ''.join(cell['source'])
        
        # Look for Prophet model creation and forecast
        if 'Prophet(' in source or 'model.predict' in source or 'model.plot' in source:
            print(f"\n--- Cell {i} ---")
            print(source[:500])  # First 500 chars
            
            # Check if there are outputs
            if 'outputs' in cell and cell['outputs']:
                print("\n[Has outputs]")
                for output in cell['outputs']:
                    if 'data' in output:
                        if 'text/plain' in output['data']:
                            print("Output:", output['data']['text/plain'][:200])
