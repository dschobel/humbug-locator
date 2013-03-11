// Saves options to localStorage.
function save_options() {
  localStorage["user"] = document.getElementById("user").value;
  localStorage["password"] = document.getElementById("password").value;
  localStorage["server"] = document.getElementById("server").value;

  // Update status to let user know options were saved.
  var status = document.getElementById("status");
  status.innerHTML = "Server and Credentials Saved.";
  setTimeout(function() {
    status.innerHTML = "";
  }, 750);
}

// Restores select box state to saved value from localStorage.
function restore_options() {
  var user = localStorage["user"];
  var server = localStorage["server"];
  var pw = localStorage["password"];
  if (user) {
      document.getElementById("user").value = user;
  }

  if (pw) {
      document.getElementById("password").value = pw;
  }
  if(server){
      document.getElementById("server").value = server;
  }
}

document.addEventListener('DOMContentLoaded', restore_options);
document.querySelector('#save').addEventListener('click', save_options);
