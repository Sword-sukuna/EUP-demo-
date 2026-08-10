// ========== UI ==========

function updateHUD(player, roomName) {
  // sanidade
  const fill = document.getElementById('sanity-fill');
  const pct = Math.max(0, player.sanity);
  fill.style.width = pct + '%';

  if (pct < 30) {
    fill.style.background = 'linear-gradient(90deg, #4a0000, #8b0000)';
  } else if (pct < 60) {
    fill.style.background = 'linear-gradient(90deg, #6a1a00, #c45a00)';
  } else {
    fill.style.background = 'linear-gradient(90deg, #8b0000, #c41e3a)';
  }

  // nome da sala
  document.getElementById('room-name').textContent = roomName;

  // inventário
  const slots = document.querySelectorAll('.slot');
  const icons = {
    cafe: '☕',
    faca: '🔪',
    lanterna: '🔦',
    chave: '🔑'
  };

  slots.forEach((slot, i) => {
    const item = player.inventory[i];
    slot.textContent = item ? (icons[item] || '?') : '';
    slot.classList.toggle('selected', i === player.selectedSlot);

    // limpa nome antigo
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

function showMessage(text, duration = 2200) {
  const el = document.getElementById('message');
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove('show'), duration);
}

function showStartScreen() {
  document.getElementById('start-screen').classList.remove('hidden');
  document.getElementById('gameover-screen').classList.add('hidden');
}

function hideStartScreen() {
  document.getElementById('start-screen').classList.add('hidden');
}

function showGameOver() {
  document.getElementById('gameover-screen').classList.remove('hidden');
}
