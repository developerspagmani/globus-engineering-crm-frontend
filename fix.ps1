 = Get-Content -Path "src\components\shared\VendorChallanFormatA.tsx" -Raw
 =  -replace "\{data\.status === 'cancelled' && data\.inwardNo && \(", "{((data.status === 'cancelled' && data.inwardNo) || (data.processName === 'REJECTED / RETURNED')) && ("
 =  -replace "\{data\.processName && \!\(data\.status === 'cancelled' && data\.inwardNo\) && \(", "{data.processName && data.processName !== 'REJECTED / RETURNED' && !(data.status === 'cancelled' && data.inwardNo) && ("
Set-Content -Path "src\components\shared\VendorChallanFormatA.tsx" -Value  -NoNewline

 = Get-Content -Path "src\components\shared\VendorChallanFormatB.tsx" -Raw
 =  -replace "\{data\.status === 'cancelled' && data\.inwardNo && \(", "{((data.status === 'cancelled' && data.inwardNo) || (data.processName === 'REJECTED / RETURNED')) && ("
 =  -replace "\{data\.processName && \!\(data\.status === 'cancelled' && data\.inwardNo\) && \(", "{data.processName && data.processName !== 'REJECTED / RETURNED' && !(data.status === 'cancelled' && data.inwardNo) && ("
Set-Content -Path "src\components\shared\VendorChallanFormatB.tsx" -Value  -NoNewline
