# Complete Translations for MBI Dashboard

## Translations cần thêm vào dictionary.ts

### Chart Labels (Biểu đồ)
```typescript
// Chart specific
salesByDate: "Sales by Date",
salesByMonth: "Sales by Month", 
salesBySource: "Sales by Source",
recentTransactions: "Recent Transactions",
date: "Date",
amount: "Amount",
source: "Source",
total: "Total",
count: "Count",
month: "Month",
january: "January",
february: "February",
march: "March",
april: "April",
may: "May",
june: "June",
july: "July",
august: "August",
september: "September",
october: "October",
november: "November",
december: "December",
```

### Vietnamese
```typescript
salesByDate: "Doanh thu theo ngày",
salesByMonth: "Doanh thu theo tháng",
salesBySource: "Doanh thu theo nguồn",
recentTransactions: "Giao dịch gần đây",
date: "Ngày",
amount: "Số tiền",
source: "Nguồn",
total: "Tổng",
count: "Số lượng",
month: "Tháng",
january: "Tháng 1",
february: "Tháng 2",
march: "Tháng 3",
april: "Tháng 4",
may: "Tháng 5",
june: "Tháng 6",
july: "Tháng 7",
august: "Tháng 8",
september: "Tháng 9",
october: "Tháng 10",
november: "Tháng 11",
december: "Tháng 12",
```

## Files cần cập nhật

1. **frontend/src/components/charts/** - Tất cả chart components
2. **frontend/src/components/dashboard/** - Dashboard components
3. **frontend/src/components/ExcelUpload.tsx** - Upload component
4. **frontend/src/app/users/page.tsx** - Users page
5. **frontend/src/app/departments/page.tsx** - Departments page
6. **frontend/src/app/login/page.tsx** - Login page
7. **frontend/src/app/register/page.tsx** - Register page

## Checklist

- [ ] Thêm translations cho chart labels
- [ ] Thêm translations cho tên tháng
- [ ] Cập nhật tất cả hardcoded text trong charts
- [ ] Cập nhật tất cả hardcoded text trong forms
- [ ] Cập nhật tất cả hardcoded text trong tables
- [ ] Cập nhật tất cả hardcoded text trong buttons
- [ ] Cập nhật tất cả hardcoded text trong tooltips
- [ ] Test cả EN và VI mode
