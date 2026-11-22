/**
 * Lead Flow - Admin CRM Dashboard Script
 */

document.addEventListener('DOMContentLoaded', function () {
  var allLeads = [];
  var tbody = document.getElementById('leads-tbody');
  var statusFilter = document.getElementById('status-filter');
  var searchInput = document.getElementById('search-input');
  var refreshBtn = document.getElementById('btn-refresh');
  var logoutBtn = document.getElementById('logout-btn');
  var userDisplay = document.getElementById('admin-user-display');

  // Verify auth session & load user
  fetch('/api/admin/me')
    .then(function (res) {
      if (res.status === 401) {
        window.location.href = '/admin/login.html';
        return;
      }
      return res.json();
    })
    .then(function (data) {
      if (data && data.user) {
        userDisplay.textContent = data.user.username;
        loadLeads();
      }
    })
    .catch(function () {
      window.location.href = '/admin/login.html';
    });

  // Load leads from server
  function loadLeads() {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center" style="padding: 30px;">Refreshing inquiries...</td></tr>';

    fetch('/api/admin/leads')
      .then(function (res) {
        if (res.status === 401) {
          window.location.href = '/admin/login.html';
          return;
        }
        return res.json();
      })
      .then(function (data) {
        if (data.success) {
          allLeads = data.leads || [];
          updateMetrics(allLeads);
          renderTable();
        } else {
          tbody.innerHTML = '<tr><td colspan="8" class="text-center error">Failed to load leads: ' + data.message + '</td></tr>';
        }
      })
      .catch(function (err) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center error">Error connecting to server.</td></tr>';
      });
  }

  // Update top metrics counters
  function updateMetrics(leads) {
    var total = leads.length;
    var newCount = leads.filter(function (l) { return l.status === 'new'; }).length;
    var contactedCount = leads.filter(function (l) { return l.status === 'contacted'; }).length;
    var qualifiedCount = leads.filter(function (l) { return l.status === 'qualified'; }).length;

    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-new').textContent = newCount;
    document.getElementById('stat-contacted').textContent = contactedCount;
    document.getElementById('stat-qualified').textContent = qualifiedCount;
  }

  // Render leads in HTML table
  function renderTable() {
    var selectedStatus = statusFilter.value;
    var query = searchInput.value.toLowerCase().trim();

    var filtered = allLeads.filter(function (l) {
      var matchStatus = (selectedStatus === 'all') || (l.status === selectedStatus);
      var matchQuery = !query ||
        (l.full_name && l.full_name.toLowerCase().indexOf(query) !== -1) ||
        (l.phone && l.phone.indexOf(query) !== -1) ||
        (l.company && l.company.toLowerCase().indexOf(query) !== -1) ||
        (l.email && l.email.toLowerCase().indexOf(query) !== -1);
      return matchStatus && matchQuery;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center" style="padding: 40px; color: #64748b;">No leads match the selected filter.</td></tr>';
      return;
    }

    var html = '';
    filtered.forEach(function (l) {
      var dateObj = new Date(l.created_at);
      var formattedDate = dateObj.toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });

      html += '<tr data-id="' + l.id + '">';
      html += '  <td><small style="color: #64748B;">' + formattedDate + '</small><br><span style="font-size: 11px; color: #94A3B8;">' + (l.source_page || 'Direct') + '</span></td>';
      html += '  <td><strong>' + escapeHtml(l.full_name) + '</strong><br><small style="color: #64748B;">' + escapeHtml(l.company || 'Individual') + '</small></td>';
      html += '  <td>';
      html += '    <a href="tel:' + l.phone + '" style="font-weight: 600; color: #3B82F6;">' + l.phone + '</a><br>';
      html += '    <a href="' + (l.whatsapp_url || '#') + '" target="_blank" rel="noopener noreferrer" class="wa-quick-btn">';
      html += '      💬 Chat WhatsApp';
      html += '    </a><br>';
      html += '    <small style="color: #64748B;">' + escapeHtml(l.email) + '</small>';
      html += '  </td>';
      html += '  <td><span class="badge-role" style="background: #E0E7FF; color: #3730A3;">' + escapeHtml(l.service) + '</span></td>';
      html += '  <td><strong>' + escapeHtml(l.budget) + '</strong></td>';
      html += '  <td style="max-width: 240px; font-size: 0.82rem; color: #334155;">' + (escapeHtml(l.project_details) || '<em>None</em>') + '</td>';
      html += '  <td>';
      html += '    <select class="form-control status-select" style="padding: 4px 8px; font-size: 0.8rem;" data-id="' + l.id + '">';
      html += '      <option value="new"' + (l.status === 'new' ? ' selected' : '') + '>New</option>';
      html += '      <option value="contacted"' + (l.status === 'contacted' ? ' selected' : '') + '>Contacted</option>';
      html += '      <option value="qualified"' + (l.status === 'qualified' ? ' selected' : '') + '>Qualified</option>';
      html += '      <option value="closed"' + (l.status === 'closed' ? ' selected' : '') + '>Closed</option>';
      html += '    </select>';
      html += '  </td>';
      html += '  <td>';
      html += '    <button class="btn btn-secondary btn-sm btn-notes" data-id="' + l.id + '" style="padding: 4px 8px; font-size: 0.75rem;">Notes</button>';
      html += '  </td>';
      html += '</tr>';
    });

    tbody.innerHTML = html;

    // Attach status dropdown change listeners
    document.querySelectorAll('.status-select').forEach(function (select) {
      select.addEventListener('change', function () {
        var id = this.getAttribute('data-id');
        var newStatus = this.value;
        updateLeadStatusOnServer(id, newStatus);
      });
    });

    // Attach notes handler
    document.querySelectorAll('.btn-notes').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = this.getAttribute('data-id');
        var lead = allLeads.find(function (item) { return String(item.id) === String(id); });
        var note = prompt('Update internal notes for ' + lead.full_name + ':', lead.notes || '');
        if (note !== null) {
          updateLeadStatusOnServer(id, lead.status, note);
        }
      });
    });
  }

  function updateLeadStatusOnServer(id, status, notes) {
    fetch('/api/admin/leads/' + id + '/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: status, notes: notes })
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.success) {
          var lead = allLeads.find(function (item) { return String(item.id) === String(id); });
          if (lead) {
            lead.status = status;
            if (notes !== undefined) lead.notes = notes;
            updateMetrics(allLeads);
          }
        } else {
          alert('Failed to update status: ' + data.message);
        }
      })
      .catch(function () {
        alert('Server communication error.');
      });
  }

  function escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Event Listeners
  statusFilter.addEventListener('change', renderTable);
  searchInput.addEventListener('input', renderTable);
  refreshBtn.addEventListener('click', loadLeads);

  logoutBtn.addEventListener('click', function () {
    fetch('/api/admin/logout', { method: 'POST' })
      .then(function () {
        window.location.href = '/admin/login.html';
      });
  });
});
