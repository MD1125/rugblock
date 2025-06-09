/*
 ________  ________  ________  ________   _______   ________     
|\   ____\|\   __  \|\   __  \|\   ___  \|\  ___ \ |\   __  \    
\ \  \___|\ \  \|\  \ \  \|\  \ \  \\ \  \ \   __/|\ \  \|\  \   
 \ \  \  __\ \  \\\  \ \  \\\  \ \  \\ \  \ \  \_|/_\ \   _  _\  
  \ \  \|\  \ \  \\\  \ \  \\\  \ \  \\ \  \ \  \_|\ \ \  \\  \| 
   \ \_______\ \_______\ \_______\ \__\\ \__\ \_______\ \__\\ _\ 
    \|_______|\|_______|\|_______|\|__| \|__|\|_______|\|__|\|__|
                                                                 
*/

function waitForElements(selector, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elements = document.querySelectorAll(selector);
      if (elements.length) {
        clearInterval(interval);
        resolve([...elements]);
      } else if (Date.now() - start > timeout) {
        clearInterval(interval);
        reject(new Error("Timeout waiting for elements"));
      }
    }, 200);
  });
}

function waitForElement(selector, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const interval = setInterval(() => {
      const el = document.querySelector(selector);
      if (el) {
        clearInterval(interval);
        resolve(el);
      } else if (Date.now() - start > timeout) {
        clearInterval(interval);
        reject(new Error("Timeout waiting for element"));
      }
    }, 200);
  });
}

const LOCAL_STORAGE_HIDE_KEY = 'adblocker-hide-messages';
const LOCAL_STORAGE_BLOCK_COUNT = 'adblocker-blocked-count';
const LOCAL_STORAGE_GAMBLE_REMINDER = 'adblocker-gamble-reminder';
let lastURL = location.href;

function createSlider(isOn, onToggle, tooltip = '') {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.alignItems = 'center';
  container.style.gap = '8px';
  container.style.marginLeft = 'auto';

  const label = document.createElement('label');
  label.style.cursor = 'pointer';
  label.style.position = 'relative';
  label.style.display = 'inline-block';
  label.style.width = '40px';
  label.style.height = '20px';
  if (tooltip) label.title = tooltip;

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = isOn;
  input.style.opacity = '0';
  input.style.width = '0';
  input.style.height = '0';

  const slider = document.createElement('span');
  slider.style.position = 'absolute';
  slider.style.top = '0';
  slider.style.left = '0';
  slider.style.right = '0';
  slider.style.bottom = '0';
  slider.style.background = isOn ? '#e7000b' : '#ccc';
  slider.style.borderRadius = '20px';
  slider.style.transition = 'background 0.3s';

  const knob = document.createElement('span');
  knob.style.position = 'absolute';
  knob.style.height = '18px';
  knob.style.width = '18px';
  knob.style.left = isOn ? '20px' : '2px';
  knob.style.top = '1px';
  knob.style.backgroundColor = 'white';
  knob.style.borderRadius = '50%';
  knob.style.transition = 'left 0.3s';

  slider.appendChild(knob);
  label.appendChild(input);
  label.appendChild(slider);
  container.appendChild(label);

  label.addEventListener('click', (e) => {
    e.stopPropagation();
    input.checked = !input.checked;
    const state = input.checked;
    knob.style.left = state ? '20px' : '2px';
    slider.style.background = state ? '#e7000b' : '#ccc';
    onToggle(state);
  });

  return container;
}

function createAdBlockBanner() {
  const container = document.createElement('div');
  container.className = 'space-y-4';
  container.style.borderBottom = '1px solid var(--border)';
  container.style.paddingBottom = '1rem';

  const innerDiv = document.createElement('div');
  innerDiv.style.textAlign = 'center';
  innerDiv.style.display = 'flex';
  innerDiv.style.flexDirection = 'column';
  innerDiv.style.alignItems = 'center';
  innerDiv.style.gap = '8px';

  const iconImg = document.createElement('img');
  iconImg.src = 'https://cdn.md1125.dev/RugBlock/icon.png';
  iconImg.style.width = '28px';
  iconImg.style.height = '28px';
  iconImg.style.filter = 'drop-shadow(0 0 2px #e7000b)';
  iconImg.style.display = 'block';
  iconImg.style.margin = '0 auto';

  const paragraph = document.createElement('p');
  paragraph.style.margin = '0';
  paragraph.style.fontSize = '14px';
  paragraph.className = 'text-sm';
  paragraph.innerHTML = '<strong>AdBlocker:</strong> Hidden to filter probable ad content.';

  innerDiv.appendChild(iconImg);
  innerDiv.appendChild(paragraph);
  container.appendChild(innerDiv);

  return container;
}

function incrementBlockCounter() {
  const current = parseInt(localStorage.getItem(LOCAL_STORAGE_BLOCK_COUNT) || '0', 10);
  localStorage.setItem(LOCAL_STORAGE_BLOCK_COUNT, String(current + 1));
}

async function injectSettingsUI() {
  try {
    const wrapper = await waitForElement('div.space-y-6');
    if (document.getElementById('rugblock-settings-container')) return;

    const container = document.createElement('div');
    container.id = 'rugblock-settings-container';
    container.className = 'bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm';
    container.style.marginTop = '1rem';

    const header = document.createElement('div');
    header.className = '@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6';

    const titleRow = document.createElement('div');
    titleRow.className = 'font-semibold leading-none flex items-center gap-2';
    titleRow.textContent = 'RugBlock';

    const infoIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    infoIcon.setAttribute('viewBox', '0 0 24 24');
    infoIcon.setAttribute('fill', 'none');
    infoIcon.setAttribute('stroke', '#aaa');
    infoIcon.setAttribute('stroke-width', '2');
    infoIcon.setAttribute('stroke-linecap', 'round');
    infoIcon.setAttribute('stroke-linejoin', 'round');
    infoIcon.style.width = '16px';
    infoIcon.style.height = '16px';
    infoIcon.style.cursor = 'default';
    infoIcon.innerHTML = `
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="16" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12" y2="8"></line>
    `;
    infoIcon.title = 'This section was inserted by RugBlock Extension.';
    titleRow.appendChild(infoIcon);

    const desc = document.createElement('p');
    desc.className = 'text-muted-foreground text-sm';
    desc.textContent = 'Manage RugBlock features';

    header.appendChild(titleRow);
    header.appendChild(desc);
    container.appendChild(header);

    const content = document.createElement('div');
    content.className = 'px-6 space-y-4';

    const hideRow = document.createElement('div');
    hideRow.className = 'flex justify-between items-center';

    const hideLabel = document.createElement('span');
    hideLabel.textContent = 'Hide Comments';

    const hideInitial = localStorage.getItem(LOCAL_STORAGE_HIDE_KEY) === '1';
    const hideSlider = createSlider(hideInitial, (state) => {
      localStorage.setItem(LOCAL_STORAGE_HIDE_KEY, state ? '1' : '0');
    }, 'Toggle visibility of suspected ad messages');

    hideRow.appendChild(hideLabel);
    hideRow.appendChild(hideSlider);

    const gambleRow = document.createElement('div');
    gambleRow.className = 'flex justify-between items-center';

    const gambleLabel = document.createElement('span');
    gambleLabel.textContent = 'Gamble Reminder';

    const gambleInitial = localStorage.getItem(LOCAL_STORAGE_GAMBLE_REMINDER) === '1';
    const gambleSlider = createSlider(gambleInitial, (state) => {
      localStorage.setItem(LOCAL_STORAGE_GAMBLE_REMINDER, state ? '1' : '0');
    }, 'Enable reminders related to gambling activity');

    gambleRow.appendChild(gambleLabel);
    gambleRow.appendChild(gambleSlider);
    content.appendChild(gambleRow);

    const blockedRow = document.createElement('div');
    blockedRow.className = 'flex justify-between items-center';

    const blockedLabel = document.createElement('span');
    blockedLabel.textContent = 'Sections Blocked';

    const blockedCode = document.createElement('code');
    blockedCode.style.background = '#1f2937';
    blockedCode.style.padding = '4px 8px';
    blockedCode.style.borderRadius = '6px';
    blockedCode.style.color = '#e7000b';
    blockedCode.style.fontFamily = "'Courier New', Courier, monospace";
    blockedCode.style.fontWeight = '600';
    blockedCode.style.fontSize = '16px';
    blockedCode.textContent = localStorage.getItem(LOCAL_STORAGE_BLOCK_COUNT) || '0';

    blockedRow.appendChild(blockedLabel);
    blockedRow.appendChild(blockedCode);

    content.appendChild(hideRow);
    content.appendChild(blockedRow);

    container.appendChild(content);

    wrapper.insertBefore(container, wrapper.children[1]);
  } catch (err) {
// yeah just uh die silenlty <:
  }
}

async function injectAdBlocker() {
  if (location.href.includes('/settings')) {
    await injectSettingsUI();
    return;
  }

  try {
    const svgs = await waitForElements('svg.lucide-icon.lucide-message-circle.h-5.w-5');
    svgs.forEach((svg) => {
      let container = svg;
      for (let i = 0; i < 3; i++) {
        container = container?.parentElement;
        if (!container) return;
      }

      const spaceY4 = container.querySelector('.space-y-4');
      if (!spaceY4 || spaceY4.dataset.adblockProcessed) return;

      const hasComments = [...spaceY4.childNodes].some(n => n.nodeType === Node.COMMENT_NODE);
      if (!hasComments) return;

      spaceY4.dataset.adblockProcessed = '1';

      const hideMessagesOn = localStorage.getItem(LOCAL_STORAGE_HIDE_KEY) === '1';

      const adBanner = createAdBlockBanner();
      adBanner.style.display = hideMessagesOn ? 'none' : '';
      spaceY4.style.display = hideMessagesOn ? '' : 'none';

      const hideToggle = createSlider(hideMessagesOn, (enabled) => {
        spaceY4.style.display = enabled ? '' : 'none';
        adBanner.style.display = enabled ? 'none' : '';
        localStorage.setItem(LOCAL_STORAGE_HIDE_KEY, enabled ? '1' : '0');
      }, 'Toggle visibility of suspected ad messages.');

      const svgParent = svg.parentElement;
      if (!svgParent) return;

      svgParent.querySelectorAll('.rugblock-toggle-container')?.forEach(el => el.remove());

      const togglesContainer = document.createElement('div');
      togglesContainer.className = 'rugblock-toggle-container';
      togglesContainer.style.display = 'flex';
      togglesContainer.style.gap = '6px';
      togglesContainer.style.marginLeft = 'auto';
      togglesContainer.style.alignItems = 'center';

      togglesContainer.appendChild(hideToggle);

      svgParent.appendChild(togglesContainer);

      container.insertBefore(adBanner, spaceY4);

      incrementBlockCounter();
    });
  } catch (err) {
    // sybau idc
  }
}

injectAdBlocker();

setInterval(() => {
  if (location.href !== lastURL) {
    lastURL = location.href;
    injectAdBlocker();
  }
}, 1000);



// Gambling reminder :)
const GAMBLE_REMINDER_INTERVAL = 60000; // every 60 seconds like a good person

function createGambleReminder() {
  const wrapper = document.createElement('div');
  wrapper.style.position = 'fixed';
  wrapper.style.top = '16px';
  wrapper.style.right = '16px';
  wrapper.style.zIndex = '9999';
  wrapper.style.maxWidth = '360px';
  wrapper.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
  wrapper.style.opacity = '0';
  wrapper.style.transform = 'translateY(-20px)';

  wrapper.innerHTML = `
  <div style="
    background-color: #f8d7da; 
    border: 1.5px solid #e7000b; 
    border-radius: 12px; 
    padding: 16px 24px; 
    display: flex; 
    gap: 12px;
    align-items: center;
    max-width: 480px;
  ">
    <div style="
      color: #721c24; 
      font-size: 14px; 
      line-height: 1.4; 
      font-weight: 600;
      flex-grow: 1;
      min-width: 0;
    ">
      <strong>Reminder:</strong> Don't forget to 
      <a href="https://rugplay.com/gambling" target="_blank" rel="noopener noreferrer" style="color: #721c24; text-decoration: underline;">
        gamble
      </a> away your life savings!
    </div>
  </div>
`;


  document.body.appendChild(wrapper);

  setTimeout(() => {
    wrapper.style.opacity = '1';
    wrapper.style.transform = 'translateY(0)';
  }, 10);

  setTimeout(() => {
    wrapper.style.opacity = '0';
    wrapper.style.transform = 'translateY(-20px)';
    setTimeout(() => wrapper.remove(), 300);
  }, 4000);
}


setInterval(() => {
  const enabled = localStorage.getItem('adblocker-gamble-reminder') === '1';
  if (enabled) createGambleReminder();
}, GAMBLE_REMINDER_INTERVAL);

