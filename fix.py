import re

def update_format(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the processName block
    pattern = r'(\{data\.processName && \(\s*<div className="[^\"]+">\s*<div className="[^\"]+">PROCESS</div>\s*<div className="[^\"]+" style=\{\{[^\}]+\}\}>\{data\.processName\}</div>\s*</div>\s*\)\})'
    
    match = re.search(pattern, content)
    if not match:
        print("Pattern not found in " + file_path)
        return

    original_block = match.group(1)
    
    # We want to replace it with:
    # 1. The STATUS CANCELLED block (for inward cancelled OR REJECTED/RETURNED process)
    # 2. The modified PROCESS block (hidden if inward cancelled OR REJECTED/RETURNED process)
    
    status_block = '''{((data.status === 'cancelled' && data.inwardNo) || (data.processName === 'REJECTED / RETURNED')) && (
                        <div className="cha-dc-row">
                           <div className="cha-dc-key" style={{ color: '#000' }}>STATUS</div>
                           <div className="cha-dc-val" style={{ fontSize: '18px', fontWeight: '900', color: '#000', letterSpacing: '1px' }}>CANCELLED</div>
                        </div>
                     )}'''
                     
    if 'fmtb' in file_path:
        status_block = status_block.replace('cha-dc-row', 'fmtb-dc-row')
        status_block = status_block.replace('cha-dc-key', 'fmtb-dc-key')
        status_block = status_block.replace('cha-dc-val', 'fmtb-dc-val')
        
    process_block = original_block.replace('{data.processName && (', '{data.processName && data.processName !== "REJECTED / RETURNED" && !(data.status === "cancelled" && data.inwardNo) && (')

    new_content = content.replace(original_block, status_block + '\n                     ' + process_block)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)

update_format('src/components/shared/VendorChallanFormatA.tsx')
update_format('src/components/shared/VendorChallanFormatB.tsx')
