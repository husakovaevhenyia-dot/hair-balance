'use strict';
(() => {
  const EMAIL = 'husakova.evhenyia@gmail.com';
  const $ = (id) => document.getElementById(id);
  const cards = [...document.querySelectorAll('.product')];
  const state = { brand: 'all', category: 'all', query: '' };
  const form = $('contact-form');
  const dialogs = [$('product-dialog'), $('privacy-dialog')];
  let detailProduct = '';
  let draftPrepared = false;
  let previousFocus = null;

  function countLabel(count) {
    const last = count % 10;
    const teens = count % 100 >= 11 && count % 100 <= 14;
    return `${count} ${!teens && last === 1 ? 'засіб' : !teens && last >= 2 && last <= 4 ? 'засоби' : 'засобів'}`;
  }
  function filterCatalog() {
    let visible = 0;
    cards.forEach((card) => {
      const match = (state.brand === 'all' || card.dataset.brand === state.brand)
        && (state.category === 'all' || card.dataset.category === state.category)
        && card.dataset.search.toLocaleLowerCase('uk').includes(state.query);
      card.hidden = !match;
      if (match) visible++;
    });
    $('catalog-count').textContent = countLabel(visible);
    $('empty-catalog').hidden = visible !== 0;
    document.querySelectorAll('[data-brand-filter]').forEach((button) => {
      const active = button.dataset.brandFilter === state.brand;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    document.querySelectorAll('.category-filters [data-category]').forEach((button) => {
      const active = button.dataset.category === state.category;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }
  function resetFilters() {
    Object.assign(state, {brand:'all', category:'all', query:''});
    $('search').value = '';
    filterCatalog();
  }
  document.querySelectorAll('[data-brand-filter]').forEach((button) => button.addEventListener('click', () => {
    state.brand = button.dataset.brandFilter;
    filterCatalog();
  }));
  document.querySelectorAll('.category-filters [data-category]').forEach((button) => button.addEventListener('click', () => {
    state.category = button.dataset.category;
    filterCatalog();
  }));
  $('search').addEventListener('input', (event) => {
    state.query = event.target.value.trim().toLocaleLowerCase('uk');
    filterCatalog();
  });
  $('reset-filters').addEventListener('click', resetFilters);
  document.querySelectorAll('[data-need]').forEach((link) => link.addEventListener('click', () => {
    resetFilters();
    state.category = link.dataset.need;
    filterCatalog();
  }));

  const menu = document.querySelector('.menu-toggle');
  function closeMenu() {
    menu.setAttribute('aria-expanded', 'false');
    $('navigation').classList.remove('is-open');
    menu.querySelector('.sr-only').textContent = 'Відкрити меню';
  }
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    menu.querySelector('.sr-only').textContent = open ? 'Закрити меню' : 'Відкрити меню';
    $('navigation').classList.toggle('is-open', open);
  });
  $('navigation').querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenu(); });

  function openDialog(dialog) {
    previousFocus = document.activeElement;
    dialogs.forEach((other) => { if (other.open) other.close(); });
    dialog.showModal();
    document.body.style.overflow = 'hidden';
  }
  dialogs.forEach((dialog) => {
    dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => {
      const box = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) dialog.close();
    });
    dialog.addEventListener('close', () => {
      if (!dialogs.some((other) => other.open)) document.body.style.overflow = '';
      if (previousFocus?.isConnected) previousFocus.focus({preventScroll:true});
    });
  });
  document.querySelectorAll('[data-policy]').forEach((button) => button.addEventListener('click', () => openDialog($('privacy-dialog'))));
  function clearDraft() {
    if (!draftPrepared) return;
    $('form-result').replaceChildren();
    $('form-result').hidden = true;
    draftPrepared = false;
  }
  function selectProduct(product) {
    if ($('product-dialog').open) $('product-dialog').close();
    $('selected-product').value = product;
    clearDraft();
    $('contacts').scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block:'start'});
    $('customer-name').focus({preventScroll:true});
  }
  document.querySelectorAll('[data-order]').forEach((button) => button.addEventListener('click', () => selectProduct(button.dataset.order)));
  document.querySelector('[data-consult]').addEventListener('click', () => selectProduct('Консультація щодо підбору догляду'));
  document.querySelectorAll('[data-details]').forEach((button) => button.addEventListener('click', () => {
    const info = JSON.parse(button.closest('.product').dataset.info);
    detailProduct = `${info.brand} · ${info.name}`;
    $('detail-brand').textContent = info.brand;
    $('detail-name').textContent = info.name;
    $('detail-target').textContent = info.target;
    $('detail-description').textContent = info.description;
    $('detail-volume').textContent = info.volume;
    $('detail-ph').textContent = info.ph;
    $('detail-ph-row').hidden = !info.ph;
    $('detail-image').src = `assets/${info.image}`;
    $('detail-image').alt = `${info.brand} ${info.name}`;
    openDialog($('product-dialog'));
  }));
  $('detail-order').addEventListener('click', () => selectProduct(detailProduct));

  const fields = [
    {input:$('customer-name'), error:$('name-error')},
    {input:$('customer-phone'), error:$('phone-error')},
    {input:$('privacy-consent'), error:$('consent-error')},
  ];
  fields.forEach(({input,error}) => input.addEventListener('input', () => {
    input.removeAttribute('aria-invalid');
    error.textContent = '';
  }));
  form.addEventListener('input', clearDraft);

  async function copyText(value, fallback) {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      if (fallback) { fallback.focus(); fallback.select(); }
      return false;
    }
  }
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    fields.forEach(({input,error}) => {input.removeAttribute('aria-invalid'); error.textContent='';});
    let firstInvalid = null;
    const invalid = (index,message) => {
      fields[index].input.setAttribute('aria-invalid','true');
      fields[index].error.textContent=message;
      firstInvalid ||= fields[index].input;
    };
    const name = $('customer-name').value.trim();
    const phone = $('customer-phone').value.trim();
    const digits = phone.replace(/\D/g,'');
    if (!name) invalid(0,'Вкажіть, будь ласка, ваше ім’я.');
    if (!/^[+\d\s().-]+$/.test(phone) || !/^(0\d{9}|380\d{9})$/.test(digits)) invalid(1,'Вкажіть телефон: +380 і 9 цифр або 0 і 9 цифр.');
    if (!$('privacy-consent').checked) invalid(2,'Підтвердьте згоду для відповіді на звернення.');
    if (firstInvalid) { firstInvalid.focus(); return; }

    const product = $('selected-product').value.trim();
    const subject = product ? `Hair Balance: ${product}` : 'Hair Balance: звернення щодо догляду';
    const body = ["Вітаю, Євгеніє!",'',`Ім’я: ${name}`,`Телефон: ${phone}`,`Цікавить: ${product || 'Підбір догляду'}`,`Коментар: ${$('customer-message').value.trim() || '—'}`,'','Прошу уточнити актуальну ціну, наявність і деталі замовлення.','Погоджуюся на обробку цих даних для відповіді на звернення.'].join('\n');
    const result = $('form-result');
    result.replaceChildren();
    const title = document.createElement('h3'); title.textContent='Звернення готове до надсилання';
    const note = document.createElement('p'); note.textContent='Перевірте текст нижче, відкрийте лист і надішліть його зі своєї пошти. Дані ще не надіслано.';
    const actions = document.createElement('div'); actions.className='draft-actions';
    const mail = document.createElement('a'); mail.className='button button-dark'; mail.textContent='Відкрити лист';
    mail.href=`mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const copy = document.createElement('button'); copy.type='button'; copy.className='button button-outline'; copy.textContent='Копіювати текст';
    const preview = document.createElement('textarea'); preview.readOnly=true; preview.value=body; preview.setAttribute('aria-label','Текст звернення');
    const help = document.createElement('p'); help.className='draft-help'; help.textContent=`Якщо пошта не відкрилася, скопіюйте звернення та надішліть на ${EMAIL}.`;
    copy.addEventListener('click', async () => {
      copy.disabled=true;
      const copied=await copyText(body,preview);
      copy.disabled=false;
      copy.textContent=copied?'Скопійовано':'Текст виділено';
      help.textContent=copied?`Вставте текст у лист на ${EMAIL}.`:'Скопіюйте виділений текст вручну та вставте його в лист.';
    });
    actions.append(mail,copy); result.append(title,note,actions,preview,help);
    result.hidden=false; draftPrepared=true;
    result.scrollIntoView({behavior:'smooth',block:'nearest'});
  });
  $('copy-iban').addEventListener('click', async () => {
    const copied=await copyText($('iban-value').textContent.trim());
    $('copy-iban').textContent=copied?'Скопійовано':'Копіювати';
    $('bank-feedback').textContent=copied?'IBAN скопійовано. Узгодьте суму та деталі замовлення перед оплатою.':'Не вдалося скопіювати автоматично. Виділіть та скопіюйте IBAN вручну.';
  });
  $('year').textContent=String(new Date().getFullYear());
})();
