document.addEventListener('DOMContentLoaded', function () {
  var form = document.getElementById('admin-login-form');
  var feedback = document.getElementById('login-feedback');
  var btn = document.getElementById('login-btn');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    feedback.style.display = 'none';

    var username = form.username.value.trim();
    var password = form.password.value;

    btn.disabled = true;
    btn.textContent = 'Verifying...';

    fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username, password: password })
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.success) {
          window.location.href = '/admin';
        } else {
          btn.disabled = false;
          btn.textContent = 'Log In to Dashboard';
          feedback.className = 'form-feedback error';
          feedback.textContent = data.message || 'Invalid username or password';
          feedback.style.display = 'block';
        }
      })
      .catch(function () {
        btn.disabled = false;
        btn.textContent = 'Log In to Dashboard';
        feedback.className = 'form-feedback error';
        feedback.textContent = 'Network or server error. Please try again.';
        feedback.style.display = 'block';
      });
  });
});
