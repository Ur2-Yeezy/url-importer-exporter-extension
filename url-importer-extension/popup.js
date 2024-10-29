
/**
 * URL Importer Extension
 * Author: Ur2_Yeezy
 * Description: Imports multiple URLs from a text file and opens them in new tabs and exports open tabs to a text file.
 */
//import funtionality
document.getElementById('importButton').addEventListener('click', function() {
  const fileInput = document.getElementById('fileInput');
  
  if (fileInput.files.length === 0) {
    alert('Please select a text file containing URLs.');
    return;
  }

  const file = fileInput.files[0];
  const reader = new FileReader();

  reader.onload = function(event) {
    const text = event.target.result;
    const lines = text.split(/\r?\n/);

    // Corrected the filter line
    const urls = lines.filter(line => {
      const trimmedLine = line.trim();
      return trimmedLine.startsWith('https://') || trimmedLine.startsWith('http://') || trimmedLine === 'chrome://newtab/';
    });

    if (urls.length === 0) {
      alert('No valid URLs found in the file.');
      return;
    }

    urls.forEach(url => {
      const trimmedUrl = url.trim();
      if (trimmedUrl) {
        if (trimmedUrl === 'chrome://newtab/') {
          // Create a new tab without specifying a URL
          chrome.tabs.create({ active: false }, function(tab) {
            // Optionally handle the new tab here
          });
        } else {
          chrome.tabs.create({ url: trimmedUrl, active: false }, function(tab) {
            function onUpdated(tabId, changeInfo, updatedTab) {
              if (tabId === tab.id && changeInfo.status === 'loading') {
                // Offload the tab
                chrome.tabs.discard(tab.id, function() {
                  if (chrome.runtime.lastError) {
                    console.error(`Error discarding tab ${tab.id}: ${chrome.runtime.lastError.message}`);
                  }
                });
                // Remove the listener since we don't need it anymore
                chrome.tabs.onUpdated.removeListener(onUpdated);
              }
            }

            // Add listener for tab updates
            chrome.tabs.onUpdated.addListener(onUpdated);
          });
        }
      }
    });
  };

  reader.readAsText(file);
});

//export functionality
document.getElementById('exportButton').addEventListener('click', function() {
  // Query all tabs in the current window
  chrome.tabs.query({ currentWindow: true }, function(tabs) {
    if (tabs.length === 0) {
      alert('No open tabs to export.');
      return;
    }

    // Collect the URLs from all open tabs
    const urls = tabs.map(tab => tab.url);

    // Create a Blob from the URLs
    const blob = new Blob([urls.join('\n')], { type: 'text/plain' });

    // Generate a filename with the current date and time
    const date = new Date();
    const filename = `tabs_${date.getFullYear()}-${('0'+(date.getMonth()+1)).slice(-2)}-${('0'+date.getDate()).slice(-2)}_${('0'+date.getHours()).slice(-2)}-${('0'+date.getMinutes()).slice(-2)}-${('0'+date.getSeconds()).slice(-2)}.txt`;

    // Create a link to trigger the download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;

    // Append the link to the DOM and trigger a click
    document.body.appendChild(link);
    link.click();

    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });
});