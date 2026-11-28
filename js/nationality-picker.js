/* ICF Gambia nationality picker.
 * Independent, accessible country search and calling-code synchronisation.
 * The picker deliberately avoids native <select> controls so Android Chrome
 * renders the results inside the page rather than opening a system dialog.
 */
(function () {
  'use strict';
  var initialized = false;
  var allCountries = [];
  var phoneCountries = [];

  function normalise(value) {
    var text = String(value == null ? '' : value).toLowerCase().trim();
    try { text = text.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch (_) {}
    return text;
  }
  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }
  function getCountry(code) {
    return window.ICFCountryData && window.ICFCountryData.getCountry(code);
  }
  function syncPhoneCountry(country) {
    if (!country || !country.dialCode) return;
    window.selectedDialCode = country.dialCode;
    window.selectedCountryCode = country.code;
    var flag = document.getElementById('flag-display-phone');
    var dial = document.getElementById('code-display-phone');
    var button = document.getElementById('flag-btn-phone');
    var input = document.getElementById('su-phone');
    if (flag) flag.textContent = country.flag;
    if (dial) dial.textContent = country.dialCode;
    if (button) {
      button.setAttribute('aria-label', 'Phone country: ' + country.name + ', ' + country.dialCode);
      button.setAttribute('data-country-code', country.code);
      button.title = country.name + ' ' + country.dialCode;
    }
    if (input) {
      input.placeholder = country.code === 'GM' ? '9XXXXXX' : 'Enter local phone number';
      input.setAttribute('aria-label', 'Phone number for ' + country.name + ' ' + country.dialCode);
    }
  }
  function selectCountry(country) {
    var codeInput = document.getElementById('su-nationality-code');
    var nameInput = document.getElementById('su-nationality-val');
    var display = document.getElementById('nat-display-nationality');
    var search = document.getElementById('dd-nationality-search');
    var wrap = document.getElementById('wrap-nationality');
    if (!country || !codeInput || !nameInput) return;
    codeInput.value = country.code;
    nameInput.value = country.name;
    if (display) display.textContent = country.flag + ' ' + country.name;
    if (wrap) wrap.setAttribute('data-selected-country', country.code);
    document.querySelectorAll('#list-nationality .country-item[aria-selected="true"]').forEach(function (item) {
      item.removeAttribute('aria-selected');
    });
    var selected = document.querySelector('#list-nationality .country-item[data-code="' + country.code + '"]');
    if (selected) selected.setAttribute('aria-selected', 'true');
    syncPhoneCountry(country);
    if (search) search.value = '';
    render('');
    var error = document.getElementById('err-nationality');
    if (error) error.style.display = 'none';
    document.dispatchEvent(new CustomEvent('icf:nationality-selected', {detail:{code:country.code,name:country.name,dialCode:country.dialCode}}));
  }
  function render(query) {
    var list = document.getElementById('list-nationality');
    var status = document.getElementById('nationality-search-status');
    if (!list) return;
    var q = normalise(query);
    var matches = allCountries.filter(function (country) {
      var haystack = normalise([country.name,country.code,country.region,country.dialCode].join(' '));
      return !q || haystack.indexOf(q) !== -1;
    });
    var groups = [];
    matches.forEach(function (country) {
      var group = groups.find(function (item) { return item.name === country.region; });
      if (!group) { group = {name:country.region,countries:[]}; groups.push(group); }
      group.countries.push(country);
    });
    list.innerHTML = groups.map(function (group) {
      return '<section class="country-group" data-country-group="' + escapeHtml(group.name) + '">' +
        '<div class="country-group-title">' + escapeHtml(group.name) + '</div>' +
        group.countries.map(function (country) {
          return '<button type="button" class="country-item" role="option" aria-selected="' +
            (country.code === (document.getElementById('su-nationality-code') || {}).value ? 'true' : 'false') +
            '" data-code="' + escapeHtml(country.code) + '">' +
            '<span class="country-item-flag" aria-hidden="true">' + escapeHtml(country.flag) + '</span>' +
            '<span class="country-item-name">' + escapeHtml(country.name) + '</span>' +
            '<span class="country-item-code">' + escapeHtml(country.code) + '</span></button>';
        }).join('') + '</section>';
    }).join('');
    if (status) {
      status.textContent = matches.length
        ? (q ? matches.length + ' matching country/territory' + (matches.length === 1 ? '' : 'ies') + ' · tap to select' : allCountries.length + ' countries and territories · grouped by region')
        : 'No country found for “' + String(query || '').trim() + '”. Try a country name or ISO code.';
    }
    list.setAttribute('aria-label', matches.length + ' matching countries and territories');
  }
  function init() {
    var wrap = document.getElementById('wrap-nationality');
    var search = document.getElementById('dd-nationality-search');
    var list = document.getElementById('list-nationality');
    if (!wrap || !search || !list || !window.ICFCountryData) return;
    allCountries = window.ICFCountryData.getAll();
    phoneCountries = window.ICFCountryData.getPhoneCountries();
    if (!allCountries.length) {
      var status = document.getElementById('nationality-search-status');
      if (status) status.textContent = 'Country data could not be loaded. Refresh the page and try again.';
      return;
    }
    if (!initialized) {
      initialized = true;
      search.addEventListener('input', function () { render(search.value); });
      search.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
          var first = list.querySelector('.country-item');
          if (first) { event.preventDefault(); selectCountry(getCountry(first.getAttribute('data-code'))); }
        } else if (event.key === 'Escape') {
          search.value = '';
          render('');
        } else if (event.key === 'ArrowDown') {
          var next = list.querySelector('.country-item');
          if (next) { event.preventDefault(); next.focus(); }
        }
      });
      list.addEventListener('click', function (event) {
        var button = event.target.closest('.country-item[data-code]');
        if (!button) return;
        selectCountry(getCountry(button.getAttribute('data-code')));
      });
      list.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') search.focus();
      });
      window.addEventListener('icf:page-changed', function (event) {
        if (event.detail && event.detail.page === 'signup') {
          if (!list.children.length) render(search.value);
        }
      });
    }
    if (!list.children.length) render(search.value);
    var selectedCode = (document.getElementById('su-nationality-code') || {}).value;
    if (selectedCode) {
      var selectedCountry = getCountry(selectedCode);
      if (selectedCountry) {
        var display = document.getElementById('nat-display-nationality');
        if (display) display.textContent = selectedCountry.flag + ' ' + selectedCountry.name;
        syncPhoneCountry(selectedCountry);
      }
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  window.ICFNationalityPicker = {init:init,render:render,select:function (code) { selectCountry(getCountry(code)); }};
})();