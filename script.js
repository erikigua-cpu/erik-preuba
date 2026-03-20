const screens = Array.from(document.querySelectorAll('.screen'));
const nextButtons = Array.from(document.querySelectorAll('[data-action="next"]'));
const form = document.getElementById('scent-form');
const resultProfile = document.getElementById('result-profile');

const profileRules = {
  style: {
    Fresh: 'Fresh',
    Elegant: 'Elegant',
    Sexy: 'Amber',
    Sport: 'Citrus',
    Warm: 'Warm',
  },
  occasion: {
    Daily: 'Woody',
    Night: 'Intense',
    Special: 'Velvet',
    Work: 'Clean',
  },
  personality: {
    Calm: 'Elegant',
    Strong: 'Bold',
    Creative: 'Artistic',
    Romantic: 'Soft',
  },
};

let currentScreen = 0;

function showScreen(index) {
  screens.forEach((screen, screenIndex) => {
    const isActive = screenIndex === index;
    screen.classList.toggle('screen--active', isActive);
    screen.setAttribute('aria-hidden', String(!isActive));
  });
  currentScreen = index;
}

function buildProfile(formData) {
  const style = profileRules.style[formData.get('style')] || 'Fresh';
  const occasion = profileRules.occasion[formData.get('occasion')] || 'Woody';
  const personality = profileRules.personality[formData.get('personality')] || 'Elegant';
  const weather = formData.get('weather');

  const weatherAccent = {
    Hot: 'Bright',
    Cold: 'Velvety',
    Mixed: occasion,
  }[weather] || occasion;

  return `${style} – ${weatherAccent === occasion ? occasion : weatherAccent} – ${personality}`;
}

nextButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const nextIndex = Math.min(currentScreen + 1, screens.length - 1);
    showScreen(nextIndex);
  });
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  resultProfile.textContent = buildProfile(formData);
  showScreen(2);
});

showScreen(0);
