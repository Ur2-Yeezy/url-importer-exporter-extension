
/**
 * URL Importer Extension
 * Author: Ur2_Yeezy
 * Description: Imports multiple URLs from a text file and opens them in new tabs.
 */
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
    const urls = lines.filter(line => line.trim().startsWith('https://'));

    if (urls.length === 0) {
      alert('No valid URLs found in the file.');
      return;
    }

    urls.forEach(url => {
      const trimmedUrl = url.trim();
      if (trimmedUrl) {
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
    });
  };

  reader.readAsText(file);
});

