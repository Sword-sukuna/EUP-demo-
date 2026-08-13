// ========== UI ==========

function itemIcon(item) {
  const icons = {
    cafe: '☕',
    faca: '🔪',
    lanterna: '🔦',
    chave: '🔑',
    chave_esq: '🔑',
    chave_dir: '🔑',
    chave_dir2: '🔑',
    chave_beco: '🔑',
    chave_f2a: '🔑',
    chave_f2b: '🔑',
    chave_boss: '🔑',
    carta_2andar: '📜',
  };
  return icons[item] || '•';
}

function itemLabel(item) {
  if (typeof KEY_LABELS !== 'undefined' && KEY_LABELS[item]) return KEY_LABELS[item];
  return item;
}

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

  // objetivo atual
  const objEl = document.getElementById('objective');
  if (objEl && typeof getObjective === 'function') {
    objEl.textContent = getObjective();
  }

  const slots = document.querySelectorAll('.slot');
  slots.forEach((slot, i) => {
    const item = player.inventory[i];
    slot.classList.toggle('selected', i === player.selectedSlot);
    slot.innerHTML = '';
    if (!item) {
      slot.title = '';
      return;
    }
    slot.title = itemLabel(item);
    if (item === 'carta_2andar' || (item + '').startsWith('carta')) {
      const img = document.createElement('img');
      img.src = 'assets/sprites/carta/carta_icon.png';
      img.alt = 'carta';
      img.style.width = '28px';
      img.style.height = '28px';
      img.style.imageRendering = 'pixelated';
      slot.appendChild(img);
    } else {
      slot.textContent = itemIcon(item);
    }
    const name = document.createElement('div');
    name.className = 'item-name';
    name.textContent = slot.title;
    slot.appendChild(name);
  });
}

function showMessage(text, duration = 2400) {
  const el = document.getElementById('message');
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove('show'), duration);
}
