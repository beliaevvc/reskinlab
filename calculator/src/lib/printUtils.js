/**
 * Generic print helper — opens a popup with the given element's HTML and all page styles
 */
function printElement(elementId, title = 'Print') {
  const el = document.getElementById(elementId);
  if (!el) {
    console.error(`Element #${elementId} not found`);
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
      if (sheet.href) {
        styles += `@import url("${sheet.href}");\n`;
      }
    }
  }

  const popup = window.open('', 'print', 'width=900,height=700');
  if (!popup) {
    alert('Please allow popups to print');
    return;
  }

  popup.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
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
    ${el.innerHTML}
  </div>
  <script>
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

/**
 * Print legal text / terms & conditions
 */
export function printLegalText() {
  printElement('legal-text-view', 'Terms & Conditions');
}

/**
 * Print specification by creating a popup with full styles
 */
export function printSpecification() {
  printElement('specification-view', 'Specification');
}
