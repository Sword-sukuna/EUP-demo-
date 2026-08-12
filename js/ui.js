// ========== UI ==========

function updateHUD(player, roomName) {
  const fill = document.getElementById('sanity-fill');
  const pct = Math.max(0, player.sanity);
  fill.style.width = pct + '%';

  if (pct < 25) {
    fill.style.background = 'linear-gradient(90deg, #4a0808, #8a1010)';
  } else if (pct < 55) {
    fill.style.background = 'linear-gradient(90deg, #6a2010, #b04020)';
  } else {
    fill.style.background = 'linear-gradient(90deg, #6a1010, #c03030)';
  }

  document.getElementById('room-name').textContent = roomName;

  const slots = document.querySelectorAll('.slot');
  const icons = { cafe: '☕', faca: '🔪', lanterna: '🔦', chave: '🔑', chave_esq: '🔑', chave_dir: '🔑', chave_dir2: '🔑', chave_beco: '🔑' };

  slots.forEach((slot, i) => {
    const item = player.inventory[i];
    slot.textContent = item ? (icons[item] || '?') : '';
    slot.classList.toggle('selected', i === player.selectedSlot);
    const old = slot.querySelector('.item-name');
    if (old) old.remove();
    if (item) {
      const name = document.createElement('div');
      name.className = 'item-name';
      name.textContent = item;
      slot.appendChild(name);
    }
  });
}

function showMessage(text, duration = 2400) {
  const el = document.getElementById('message');
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove('show'), duration);
}
