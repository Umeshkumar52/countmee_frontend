const fs = require('fs');
const path = require('path');

const files = [
  'src/features/admin/components/BulkUploadDpModal.jsx',
  'src/features/admin/pages/Customers.jsx',
  'src/features/admin/pages/Dashboard.jsx',
  'src/features/admin/pages/DeliveryPartners.jsx',
  'src/features/admin/pages/DpDocumentVerification.jsx',
  'src/features/admin/pages/EditChargeConfig.jsx',
  'src/features/admin/pages/FeedbackRatings.jsx',
  'src/features/admin/pages/PdcDetails.jsx',
  'src/features/admin/pages/PdcList.jsx',
  'src/features/admin/pages/Reports.jsx',
  'src/features/auth/authSlice.js',
  'src/features/orders/components/AssignOrderModal.jsx',
  'src/features/orders/pages/BroadcastBundlesPage.jsx',
  'src/features/orders/pages/BundleResponsesPage.jsx',
  'src/features/orders/pages/BundleTrackingPage.jsx',
  'src/features/orders/pages/OrderList.jsx',
  'src/features/orders/pages/OrderView.jsx',
  'src/features/orders/pages/RecommendDpPage.jsx',
  'src/features/orders/pages/ScheduledOrders.jsx',
  'src/features/payments/pages/FinanceOverview.jsx',
  'src/features/payments/pages/PartnerOrderBreakdown.jsx',
  'src/features/pdc/pages/PdcDocumentStatus.jsx',
  'src/features/pdc/pages/PdcEarning.jsx',
  'src/features/pdc/pages/PdcHome.jsx',
  'src/features/pdc/pages/PdcOrderHistory.jsx',
  'src/features/pdc/pages/PdcRatings.jsx',
  'src/features/wallets/pages/WalletDashboard.jsx'
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    console.log('File not found:', filePath);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Flag to know if we need to add the import
  let addedToast = false;

  // Replace console.error with console.error + toast.error
  // Regex looks for: console.error( or "or' Message or "or' , errorVariable )
  content = content.replace(/console\.error\(\s*(["'\])([^"'\]+)\1\s*(,\s*[a-zA-Z0-9_]+)?\s*\);?/g, (match, quote, message, errVar) => {
    addedToast = true;
    return match + \n      toast.error("");;
  });
  
  // also handle console.error(err)
  content = content.replace(/console\.error\(\s*([a-zA-Z0-9_]+)\s*\);?/g, (match, errVar) => {
    // only if it's not a string literal
    if (['"', "'", ''].includes(errVar[0])) return match;
    addedToast = true;
    return match + \n      toast.error(?.response?.data?.message || ?.message || "An error occurred");;
  });

  if (addedToast && !content.includes('import toast from')) {
    // Check if it's react-hot-toast or 'react-hot-toast'
    const importStatement = "import toast from 'react-hot-toast';\n";
    
    // Add import after other imports (or top)
    const importMatch = content.match(/^import .*$/m);
    if (importMatch) {
       // Insert at top of file
       content = importStatement + content;
    } else {
       content = importStatement + content;
    }
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Processed:', file);
});
