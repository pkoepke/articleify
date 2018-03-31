// client side JS.

// List of functions to run as soon as the page loads.
window.addEventListener('load', hideShowSpinner, false);

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

// Button handlers

function makeArticleFromUrl() {
  
}

function makeArticleFromText() {
  let articleTitle = document.getElementById('articleTitleInput').value;
  let articleText = document.getElementById('articleTextInput').value;
  var httpRequest = new XMLHttpRequest();
  httpRequest.onreadystatechange = function() { // anonymous callback that runs when the request's state changes
    if (httpRequest.readyState == 4 && httpRequest.status == 200) { // if the state is '4' aka DONE and the status aka HTTP response code is 200 aka OK, run the handler code. Otherwise do nothing, so no else statement.
      callback(httpRequest.responseText); // run the callback function, and pass it the response text as a DOMstring.
    }
  }
}