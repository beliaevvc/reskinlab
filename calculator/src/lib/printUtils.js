/**
 * Print specification by creating a popup with full styles
 */
export function printSpecification() {
  const specView = document.getElementById('specification-view');
  if (!specView) {
    console.error('Specification view not found');
    return;
  }

  // Collect all stylesheets
  let styles = '';
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        styles += rule.cssText + '\n';
      }
    } catch (e) {
      // External stylesheets - add import
      if (sheet.href) {
        styles += `@import url("${sheet.href}");\n`;
      }
    }
  }

  // Create popup
  const popup = window.open('', 'print', 'width=900,height=700');
  if (!popup) {
    alert('Please allow popups to print');
    return;
  }

  popup.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Specification</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    ${styles}
    
    html, body {
      margin: 0;
      padding: 0;
      background: white;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }
    
    body {
      padding: 40px;
    }
    
    @media print {
      body {
        padding: 0;
      }
      @page {
        margin: 1cm;
        size: A4;
      }
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  </style>
</head>
<body>
  <div class="max-w-4xl mx-auto">
    ${specView.innerHTML}
  </div>
  <script>
    // Print when ready
    window.onload = function() {
      setTimeout(function() {
        window.print();
        window.onafterprint = function() {
          window.close();
        };
      }, 100);
    };
  </script>
</body>
</html>`);
  popup.document.close();
}
