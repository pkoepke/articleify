// client side JS.

// List of functions to run as soon as the page loads.
window.addEventListener('load', hideShowSpinner, false);
window.addEventListener('load', addCopyToClipboardListener, false);

function hideShowSpinner(action) {
  let spinnerDiv = document.getElementById('loadingSpinnerDiv');
  if (action == 'show') {
    spinnerDiv.style.display = 'block';
    return 'Spinner shown.';
  } else if (action == 'hide') {
    spinnerDiv.style.display = 'none';
    return 'Spinner hidden';
  } else if (spinnerDiv.style.display == 'none') {
    spinnerDiv.style.display = 'block';
    return 'Spinner shown.';
  } else {
    spinnerDiv.style.display = 'none';
    return 'Spinner hidden';
  }
}

function copyToClipboard() {
  console.log('copyToClipboard() ran');
  let urlToCopy = document.getElementById('articleUrl');
  urlToCopy.select();
  document.execCommand("Copy");
}

function addCopyToClipboardListener() {
  console.log('addCopyToClipboardListener() ran');
  let copyToClipboardButton = document.getElementById('copyToClipboardButton');
  console.log(copyToClipboardButton);
  copyToClipboardButton.addEventListener('onclick', copyToClipboard, false);
}